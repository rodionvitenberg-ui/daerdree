"""
Management command: Парсинг ВСЕХ изображений с BGG и сохранение в GameImage-галерею.

Использует Playwright + playwright_stealth + реальный Chrome для обхода Cloudflare.

Использование:
    python manage.py scrape_bgg_images_v2 --all                # все игры
    python manage.py scrape_bgg_images_v2 --slug camel-up       # одна игра
    python manage.py scrape_bgg_images_v2 --all --force         # перезаписать существующие
    python manage.py scrape_bgg_images_v2 --all --limit 5       # первые 5 игр
    python manage.py scrape_bgg_images_v2 --all --headless      # скрытый браузер
    python manage.py scrape_bgg_images_v2 --reset-session       # сбросить Cloudflare-профиль
"""

import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils.text import slugify

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

from boardgames.models import BoardGame, GameImage

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from playwright_stealth import Stealth

# ─── GAMES_MAP: русское название → BGG ID (из scrape_bgg_v2.py) ───

GAMES_MAP = {
    "Концепт": 147151,
    "Криптид": 298048,
    "Повелитель Токио": 70423,
    "Свинтус": 336986,
    "Мафия": None,
    "Camel Up": 153938,
    "Кольт Экспресс": 169427,
    "Корова 006": None,
    "Коднеймс": 178900,
    "Декодер": None,
    "Секретный Гитлер": 110327,
    "Авалон": 128882,
    "Дэни. Голоса в голове": 286096,
    "Бункер": None,
    "Одна ночь с оборотнем": 147949,
    "Письма призрака": None,
    "Спайфол": 166384,
    "Селестия": None,
    "За бортом": None,
    "Цитадели": 478,
    "Бэнг": 3955,
    "Гномы-вредители": 9220,
    "Feed the Kraken": 349976,
    "Экивоки": None,
    "Think Fast": None,
    "Кровь на часовой башне": None,
    "Кемет": 127023,
    "Агрикола": 31260,
    "Дюна: Битва за Арракис": 316554,
    "Дюна: Апрайзинг": 380007,
    "Корни": 237182,
    "Цивилизация": 303954,
    "Брасс: Бирмингем": 224517,
    "Войны Черной Розы": 226730,
    "7 Wonders": 68448,
    "Замки Бургундии": 84876,
    "Эверделл": 285192,
    "Диксит": 39856,
    "Имаджинариум": 340303,
    "Гранд отель Австрия": None,
    "Азул": 230802,
    "Азул: Летний Дворец": 287954,
    "Азул: Сады королевы": 313392,
    "Каскадия": 295947,
    "Остров кошек": 281259,
    "Крылья": 266192,
    "Палео": 302723,
    "Индустрия": None,
    "Катан": 13,
    "Непостижимое": 223040,
    "Иниш": 255691,
    "Ганимед": None,
    "Марракеш": 345209,
    "Робинзон Крузо": 121921,
    "Истанбул": 154435,
    "Мор": None,
    "Among Cultists": 341527,
    "Magic Maze": 209778,
    "Расцвет": None,
    "Small World": 40692,
    "Легенды дикого запада": None,
    "Каркассон": 822,
    "Ticket to Ride": 9209,
    "Wyrmspan": 411105,
    "Isidore": None,
    "Лоскутное королевство": 301976,
    "Ярость Дракулы": 268563,
    "Пакс Памир": None,
    "Barenpark": 205483,
    "Манчкин": 1927,
    "Картографы": 236866,
    "Welcome to Your Perfect Home": 318977,
    "Not Enough Mana": None,
    "Диамант": 15512,
    "Гномы-вредители: Древние шахты": 227515,
    "Scythe": 169786,
    "Сквозь века": 242464,
    "Терраформирование Марса": 167791,
    "Unconscious Mind": 362514,
    "Дорога приключений": None,
    "3000 негодяев": None,
    "Эволюция": 155120,
    "Раскопки": None,
    "Санта-Моника": 306735,
    "Властелин колец": None,
    "Кланк": 201808,
    "Грибы и корни": None,
    "Игра престолов": None,
    "Ужас Аркхэма": 259497,
    "Шакал": None,
    "Фоллаут": 232405,
    "Пандемия": 30549,
    "Foodies": None,
    "Космический контакт": None,
    "Королевство кроликов": None,
    "Подводные города": 233544,
    "Fluxx": 258,
    "Бонанза": 553,
    "Куры": None,
    "Deep Sea Adventures": None,
    "Carnegie": 324447,
    "Ханаби": 98778,
    "Red7": 138680,
    "Ark Nova": 342942,
}

USER_DATA_DIR = Path("chrome_profile")  # постоянный профиль Chrome для Cloudflare

# Допустимые расширения изображений
IMG_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'}


def _is_image_url(url: str) -> bool:
    """Проверяет, похож ли URL на изображение."""
    if not url:
        return False
    url_lower = url.split("?")[0].lower()
    return any(url_lower.endswith(ext) for ext in IMG_EXTENSIONS)


def _resolve_relative_url(base: str, url: str) -> str:
    """Преобразует относительный URL в абсолютный."""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return f"https://boardgamegeek.com{url}"
    return url


def _extract_original_url(url: str) -> str:
    """
    Извлекает оригинальный URL из прокси (напр. Cloudflare image proxy BGG).
    Некоторые URL на BGG идут через cdn/image proxy.
    """
    # BGG иногда проксирует изображения через собственный CDN
    # Если URL содержит параметр url=, извлекаем его
    if "url=" in url:
        parsed = urlparse(url)
        qs = parse_qs(parsed.query)
        if "url" in qs:
            return unquote(qs["url"][0])
    return url


class Command(BaseCommand):
    help = "Парсинг изображений с BGG в GameImage-галерею (Playwright + Stealth)"

    def add_arguments(self, parser):
        parser.add_argument("--slug", type=str, default=None,
                            help="Slug конкретной игры")
        parser.add_argument("--all", action="store_true", default=False,
                            help="Обработать все игры")
        parser.add_argument("--limit", type=int, default=None,
                            help="Ограничить количество игр")
        parser.add_argument("--force", action="store_true", default=False,
                            help="Удалить старые GameImage перед скачиванием новых")
        parser.add_argument("--headless", action="store_true", default=False,
                            help="Запустить браузер в headless-режиме")
        parser.add_argument("--reset-session", action="store_true", default=False,
                            help="Удалить профиль Chrome (сброс Cloudflare)")

    def handle(self, *args, **kwargs):
        target_slug = kwargs["slug"]
        process_all = kwargs["all"]
        limit = kwargs["limit"]
        force = kwargs["force"]
        headless = kwargs["headless"]
        reset_session = kwargs["reset_session"]

        # ── Сброс профиля ──
        if reset_session:
            import shutil
            if USER_DATA_DIR.exists():
                shutil.rmtree(str(USER_DATA_DIR))
                self.stdout.write("♻️  Профиль Chrome удалён. При следующем запуске пройдите Cloudflare вручную.")
            else:
                self.stdout.write("ℹ️  Профиль и так отсутствует.")
            return

        # ── Выбор игр ──
        if target_slug:
            games = BoardGame.objects.filter(slug=target_slug)
            if not games.exists():
                self.stdout.write(self.style.ERROR(f"Игра со slug '{target_slug}' не найдена."))
                return
        elif process_all:
            games = BoardGame.objects.all()
        else:
            self.stdout.write(self.style.WARNING(
                "Укажите --slug <slug> или --all. Пример:\n"
                "  python manage.py scrape_bgg_images_v2 --slug camel-up\n"
                "  python manage.py scrape_bgg_images_v2 --all"
            ))
            return

        total = games.count()
        if limit:
            games = games[:limit]
            total = len(games)

        self.stdout.write("=" * 60)
        self.stdout.write(f"  Парсер изображений BGG v2")
        self.stdout.write(f"  Игр: {total} | Force: {force} | Headless: {headless}")
        self.stdout.write("=" * 60)

        total_downloaded = 0
        total_skipped = 0
        total_errors = 0

        with sync_playwright() as pw:
            context = pw.chromium.launch_persistent_context(
                user_data_dir=str(USER_DATA_DIR),
                headless=headless,
                channel="chrome",
                args=[
                    "--no-sandbox",
                    "--disable-blink-features=AutomationControlled",
                ],
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            )
            page = context.new_page()
            Stealth().apply_stealth_sync(page)

            for idx, game in enumerate(games, start=1):
                # ── Поиск BGG ID ──
                bgg_id = self._find_bgg_id(game)
                if not bgg_id:
                    self.stdout.write(f"\n[{idx}/{total}] {game.title} — ⚠ BGG ID не найден, пропуск")
                    total_skipped += 1
                    continue

                self.stdout.write(f"\n[{idx}/{total}] {game.title} (BGG#{bgg_id})")
                self.stdout.flush()

                try:
                    # ── Открываем страницу игры ──
                    url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
                    page.goto(url, timeout=60000, wait_until="load")

                    # Ждём загрузки контента
                    try:
                        page.wait_for_selector(
                            "script[type='application/ld+json'], "
                            "meta[property='og:image'], "
                            "a[href*='/boardgamecategory/']",
                            timeout=30000,
                        )
                    except PlaywrightTimeout:
                        self.stdout.write("  ⏳ Страница грузится долго, продолжаю...")
                        page.wait_for_timeout(10000)

                    page.wait_for_timeout(2000)

                    # ── Сбор всех URL изображений ──
                    image_urls = self._collect_all_image_urls(page)
                    self.stdout.write(f"  🖼️  Найдено URL: {len(image_urls)}")

                    if not image_urls:
                        self.stdout.write("  ⚠ Изображений не найдено на странице")
                        total_skipped += 1
                        continue

                    # ── Очистка старых, если --force ──
                    if force:
                        old_count = game.images.count()
                        if old_count:
                            game.images.all().delete()
                            self.stdout.write(f"  🗑️  Удалено {old_count} старых изображений")

                    # ── Проверка: есть ли уже изображения ──
                    existing = game.images.count()
                    if existing > 0 and not force:
                        self.stdout.write(f"  ⏩ Уже есть {existing} изображений (пропуск). Используйте --force для перезаписи.")
                        total_skipped += 1
                        continue

                    # ── Скачивание и сохранение ──
                    saved = 0
                    for img_idx, img_url in enumerate(image_urls):
                        ok = self._download_and_save(game, context, img_url, img_idx, len(image_urls))
                        if ok:
                            saved += 1
                        if saved >= 10:  # Лимит: не больше 10 изображений на игру
                            break

                    if saved > 0:
                        total_downloaded += 1
                        self.stdout.write(f"  ✅ Сохранено изображений: {saved}")
                    else:
                        total_errors += 1
                        self.stdout.write(f"  ❌ Не удалось скачать ни одного изображения")

                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  ⚠ Ошибка: {e}"))
                    total_errors += 1

                # Пауза между играми
                time.sleep(2)

            context.close()

        # ── Итоги ──
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  ИТОГИ:")
        self.stdout.write(f"    Успешно (есть изображения): {total_downloaded}")
        self.stdout.write(f"    Пропущено:                  {total_skipped}")
        self.stdout.write(f"    Ошибок:                     {total_errors}")
        self.stdout.write("=" * 60)

    # ═══════════════════════════════════════════════════════════
    #  МЕТОДЫ
    # ═══════════════════════════════════════════════════════════

    def _find_bgg_id(self, game: BoardGame) -> int | None:
        """Поиск BGG ID по названию игры в GAMES_MAP."""
        for title_ru, bgg_id in GAMES_MAP.items():
            if bgg_id and title_ru.lower() in game.title.lower():
                return bgg_id
        # Пробуем точное совпадение по slug
        for title_ru, bgg_id in GAMES_MAP.items():
            if bgg_id and slugify(title_ru, allow_unicode=True) == game.slug:
                return bgg_id
        return None

    def _collect_all_image_urls(self, page) -> list[str]:
        """
        Собирает ВСЕ URL изображений со страницы BGG:
        1. JSON-LD (schema.org)
        2. og:image / twitter:image
        3. Все <img> с расширениями изображений
        4. Все <picture> <source>
        """
        seen = set()
        urls = []

        def add(url: str):
            url = _resolve_relative_url("https://boardgamegeek.com", url)
            url = _extract_original_url(url)
            # Отсекаем совсем мелкие иконки и 1px пиксели
            if url and url not in seen and _is_image_url(url):
                # Пропускаем аватарки пользователей и иконки интерфейса
                if any(skip in url.lower() for skip in [
                    "avatar", "icon_user", "icon_", "pixel", "spacer",
                    "star_on", "star_off", "flag_", "geek", "bgg_", "logo",
                    "microbadge", "thumbs", "dropdown",
                ]):
                    return
                seen.add(url)
                urls.append(url)

        # ── 1. JSON-LD ──
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for s in scripts:
                data = json.loads(s.inner_html())
                if isinstance(data, dict):
                    if data.get("image"):
                        add(data["image"])
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and item.get("image"):
                            add(item["image"])
        except Exception:
            pass

        # ── 2. Мета-теги ──
        for meta_sel in [
            "meta[property='og:image']",
            "meta[name='twitter:image']",
            "meta[name='twitter:image:src']",
        ]:
            try:
                meta = page.query_selector(meta_sel)
                if meta:
                    content = meta.get_attribute("content")
                    if content:
                        add(content)
            except Exception:
                pass

        # ── 3. Все <img> на странице ──
        try:
            imgs = page.query_selector_all("img")
            for img in imgs:
                for attr in ("src", "data-src", "data-lazy", "data-original"):
                    src = img.get_attribute(attr)
                    if src:
                        add(src)
                # srcset (берём первый URL)
                srcset = img.get_attribute("srcset")
                if srcset:
                    first = srcset.split(",")[0].strip().split(" ")[0]
                    if first:
                        add(first)
        except Exception:
            pass

        # ── 4. <picture> <source> ──
        try:
            sources = page.query_selector_all("picture source")
            for src_el in sources:
                srcset = src_el.get_attribute("srcset")
                if srcset:
                    first = srcset.split(",")[0].strip().split(" ")[0]
                    if first:
                        add(first)
                src = src_el.get_attribute("src")
                if src:
                    add(src)
        except Exception:
            pass

        # ── 5. Ссылки из галереи BGG (img[src*='pic']) ──
        try:
            gallery_imgs = page.query_selector_all("img[src*='pic'], img[src*='image'], img[class*='img'], img[class*='game'], img[class*='photo']")
            for img in gallery_imgs:
                src = img.get_attribute("src") or img.get_attribute("data-src")
                if src:
                    add(src)
        except Exception:
            pass

        return urls

    def _download_and_save(
        self, game: BoardGame, context, url: str, index: int, total: int
    ) -> bool:
        """
        Скачивает изображение через context.request (та же сессия, Cloudflare пропускает)
        и создаёт запись GameImage.
        """
        # ── Определяем расширение из URL ──
        url_path = url.split("?")[0]
        ext = ".jpg"
        for candidate in IMG_EXTENSIONS:
            if url_path.lower().endswith(candidate):
                ext = candidate
                break

        filename = f"img_{index:02d}{ext}"

        # ── Скачивание через API Playwright (общая сессия с браузером) ──
        try:
            resp = context.request.get(url, timeout=30000)
            if resp.status != 200:
                self.stdout.write(f"    [{index + 1}/{total}] ❌ HTTP {resp.status}: {url[:80]}")
                return False

            body = resp.body()
            if len(body) < 1000:
                self.stdout.write(f"    [{index + 1}/{total}] ⚠ Слишком маленькое ({len(body)} байт): {url[:80]}")
                return False

            # ── Тип изображения ──
            if index == 0:
                image_type = GameImage.ImageType.COVER
            elif index == 1:
                image_type = GameImage.ImageType.BACKGROUND
            else:
                image_type = GameImage.ImageType.GALLERY

            # ── Создаём запись GameImage ──
            game_image = GameImage(
                game=game,
                image_type=image_type,
                order=index,
                alt=f"{game.title} — фото {index + 1}",
            )
            game_image.image.save(filename, ContentFile(body), save=False)
            game_image.save()

            # ── Первое изображение → также в game.image ──
            if index == 0 and not game.image:
                game.image.save(f"cover_{game.slug}{ext}", ContentFile(body), save=True)
                self.stdout.write(f"    [{index + 1}/{total}] ✅ cover → game.image")

            # ── Второе изображение → также в game.setup_image ──
            if index == 1 and not game.setup_image:
                game.setup_image.save(f"setup_{game.slug}{ext}", ContentFile(body), save=True)
                self.stdout.write(f"    [{index + 1}/{total}] ✅ bg → game.setup_image")

            self.stdout.write(f"    [{index + 1}/{total}] ✅ {image_type}: {filename}")
            return True

        except Exception as e:
            self.stdout.write(f"    [{index + 1}/{total}] ❌ {e}: {url[:80]}")
            return False