"""
Management command: Парсинг ВСЕХ изображений с BGG и сохранение в GameImage-галерею.

Использует nodriver (форк undetected-chromedriver) — патчит Chrome на этапе запуска,
практически гарантированно обходит Cloudflare Turnstile.

Использование:
    python manage.py scrape_bgg_images_v2 --all                # все игры
    python manage.py scrape_bgg_images_v2 --slug camel-up       # одна игра
    python manage.py scrape_bgg_images_v2 --all --force         # перезаписать существующие
    python manage.py scrape_bgg_images_v2 --all --limit 5       # первые 5 игр
    python manage.py scrape_bgg_images_v2 --all --headless      # скрытый браузер
    python manage.py scrape_bgg_images_v2 --reset-session       # сбросить Cloudflare-профиль
"""

import asyncio
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urlparse, parse_qs, unquote

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

from boardgames.models import BoardGame, GameImage

import nodriver as uc

# ─── GAMES_MAP: русское название → BGG ID ───

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

# Допустимые расширения изображений
IMG_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg"}

# User-Agent для скачивания изображений
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"


def _is_image_url(url: str) -> bool:
    if not url:
        return False
    url_lower = url.split("?")[0].lower()
    return any(url_lower.endswith(ext) for ext in IMG_EXTENSIONS)


def _resolve_relative_url(url: str) -> str:
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("//"):
        return "https:" + url
    if url.startswith("/"):
        return f"https://boardgamegeek.com{url}"
    return url


def _extract_original_url(url: str) -> str:
    if "url=" in url:
        parsed = urlparse(url)
        qs = parse_qs(parsed.query)
        if "url" in qs:
            return unquote(qs["url"][0])
    return url


class Command(BaseCommand):
    help = "Парсинг изображений с BGG в GameImage-галерею (nodriver)"

    def add_arguments(self, parser):
        parser.add_argument("--slug", type=str, default=None)
        parser.add_argument("--all", action="store_true", default=False)
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--force", action="store_true", default=False)
        parser.add_argument("--headless", action="store_true", default=False)
        parser.add_argument("--reset-session", action="store_true", default=False)

    def handle(self, *args, **kwargs):
        asyncio.run(self._handle_async(*args, **kwargs))

    async def _handle_async(self, *args, **kwargs):
        target_slug = kwargs["slug"]
        process_all = kwargs["all"]
        limit = kwargs["limit"]
        force = kwargs["force"]
        headless = kwargs["headless"]
        reset_session = kwargs["reset_session"]

        if reset_session:
            import shutil
            profile = Path.home() / ".nodriver_profile"
            if profile.exists():
                shutil.rmtree(str(profile))
                self.stdout.write("♻️  Профиль nodriver удалён.")
            else:
                self.stdout.write("ℹ️  Профиль и так отсутствует.")
            return

        if target_slug:
            games = BoardGame.objects.filter(slug=target_slug)
            if not games.exists():
                self.stdout.write(self.style.ERROR(f"Игра со slug '{target_slug}' не найдена."))
                return
        elif process_all:
            games = BoardGame.objects.all()
        else:
            self.stdout.write(self.style.WARNING(
                "Укажите --slug <slug> или --all.\n"
                "  python manage.py scrape_bgg_images_v2 --slug camel-up\n"
                "  python manage.py scrape_bgg_images_v2 --all"
            ))
            return

        total = games.count()
        if limit:
            games = games[:limit]
            total = len(games)

        self.stdout.write("=" * 60)
        self.stdout.write(f"  Парсер изображений BGG v2 (nodriver)")
        self.stdout.write(f"  Игр: {total} | Force: {force} | Headless: {headless}")
        self.stdout.write("=" * 60)

        total_downloaded = 0
        total_skipped = 0
        total_errors = 0

        browser = await uc.start(
            headless=headless,
            browser_executable_path="/usr/bin/google-chrome",
        )
        # Открываем начальную вкладку
        page = await browser.get("about:blank")

        # ── Прогрев: проходим Cloudflare на главной странице ──
        await self._cloudflare_warmup(page)

        for idx, game in enumerate(games, start=1):
            bgg_id = self._find_bgg_id(game)
            if not bgg_id:
                self.stdout.write(f"\n[{idx}/{total}] {game.title} — ⚠ BGG ID не найден, пропуск")
                total_skipped += 1
                continue

            self.stdout.write(f"\n[{idx}/{total}] {game.title} (BGG#{bgg_id})")
            self.stdout.flush()

            try:
                url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
                await page.get(url)

                # Ждём загрузки Angular-приложения
                await page.sleep(10)

                # ── Сбор URL изображений ──
                image_urls = await self._collect_all_image_urls(page)
                self.stdout.write(f"  🖼️  Найдено URL: {len(image_urls)}")

                if not image_urls:
                    self.stdout.write("  ⚠ Изображений не найдено на странице")
                    total_skipped += 1
                    continue

                if force:
                    old_count = game.images.count()
                    if old_count:
                        game.images.all().delete()
                        self.stdout.write(f"  🗑️  Удалено {old_count} старых изображений")

                existing = game.images.count()
                if existing > 0 and not force:
                    self.stdout.write(f"  ⏩ Уже есть {existing} изображений (пропуск). Используйте --force для перезаписи.")
                    total_skipped += 1
                    continue

                saved = 0
                # Применяем _cleanup_bgg_url для максимального качества
                clean_urls = [self._cleanup_bgg_url(u) for u in image_urls]
                # Дедуплицируем после очистки
                seen_clean = set()
                unique_urls = []
                for u in clean_urls:
                    if u not in seen_clean:
                        seen_clean.add(u)
                        unique_urls.append(u)

                for img_idx, img_url in enumerate(unique_urls):
                    ok = self._download_and_save(game, img_url, img_idx, len(unique_urls))
                    if ok:
                        saved += 1
                    if saved >= 10:
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

            await page.sleep(2)

        browser.stop()

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
        for title_ru, bgg_id in GAMES_MAP.items():
            if bgg_id and title_ru.lower() in game.title.lower():
                return bgg_id
        for title_ru, bgg_id in GAMES_MAP.items():
            if bgg_id and slugify(title_ru, allow_unicode=True) == game.slug:
                return bgg_id
        return None

    async def _cloudflare_warmup(self, page) -> None:
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("⏳ Открываю boardgamegeek.com в окне Chrome...")
        self.stdout.write("   Пройдите капчу вручную (если появится),")
        self.stdout.write("   затем нажмите Enter здесь для продолжения.")
        self.stdout.write("=" * 60)
        self.stdout.flush()

        try:
            await page.get("https://boardgamegeek.com/")
        except Exception as e:
            self.stdout.write(f"\n⚠ Ошибка при загрузке главной страницы: {e}")
            self.stdout.flush()
            return

        input("\n>>> Нажмите Enter когда Cloudflare пройден: ")
        self.stdout.write("✅ Начинаю парсинг!\n")
        self.stdout.flush()
        await page.sleep(1)

    async def _collect_all_image_urls(self, page) -> list[str]:
        """
        Собирает ВСЕ URL изображений через парсинг HTML (regex).
        Не использует DOM API — надёжно для Angular/SPA.
        """
        import re as regex

        html = await page.get_content()
        self.stdout.write(f"  [DEBUG] HTML размер: {len(html)} байт")
        self.stdout.flush()

        seen = set()
        urls = []

        def add(url: str):
            if not url or url in seen or url.startswith("data:"):
                return
            # Пропускаем аватарки и иконки
            url_lower = url.lower()
            if any(kw in url_lower for kw in [
                "avatar", "icon_user", "icon_", "pixel", "spacer",
                "star_on", "star_off", "flag_", "bgg_", "logo",
                "microbadge", "thumbs", "dropdown", "geekdo-static",
                "geeklistimagebar",
            ]):
                return
            # Приводим к абсолютному URL
            if url.startswith("//"):
                url = "https:" + url
            elif url.startswith("/"):
                url = "https://boardgamegeek.com" + url
            seen.add(url)
            urls.append(url)

        # 1. og:image и twitter:image
        for pattern in [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        ]:
            for match in regex.finditer(pattern, html, regex.IGNORECASE):
                add(match.group(1))

        # 2. Все URL с cf.geekdo-images.com (основной CDN BGG) — это самый надёжный метод
        # Ищем в атрибутах src, srcset, ng-src, ng-srcset, content, href
        for match in regex.finditer(
            r'''(?:src|srcset|ng-src|ng-srcset|content|href)=["\']([^"\']*cf\.geekdo-images\.com[^"\']*)["\']''',
            html,
            regex.IGNORECASE,
        ):
            raw = match.group(1)
            # Извлекаем URL из srcset (берём первый)
            if raw and " " in raw and not raw.startswith("http"):
                raw = raw.split(",")[0].strip().split(" ")[0]
            add(raw)

        # 3. JSON-LD
        for match in regex.finditer(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            html,
            regex.DOTALL | regex.IGNORECASE,
        ):
            try:
                data = json.loads(match.group(1))
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict) and item.get("image"):
                        add(item["image"])
            except Exception:
                pass

        # 4. Все <img> src (фоллбэк)
        for match in regex.finditer(
            r'<img[^>]+src=["\']([^"\']+\.(?:jpg|jpeg|png|webp|gif|bmp)(?:\?[^"\']*)?)["\']',
            html,
            regex.IGNORECASE,
        ):
            add(match.group(1))

        self.stdout.write(f"  [DEBUG] Найдено URL (regex): {len(urls)}")
        self.stdout.flush()

        # ── ФИЛЬТРАЦИЯ: отсеиваем превьюшки ──
        quality_urls = []
        for url in urls:
            url = _extract_original_url(url)
            if self._is_low_quality_url(url):
                continue
            if url and url not in quality_urls:
                quality_urls.append(url)

        skipped = len(urls) - len(quality_urls)
        if skipped > 0:
            self.stdout.write(f"  [DEBUG] Отфильтровано превьюшек: {skipped}, осталось: {len(quality_urls)}")

        return quality_urls

    def _cleanup_bgg_url(self, url: str) -> str:
        """
        Приводит URL BGG-изображения к наилучшему качеству:
        - Убирает __crop100, __square100 и т.п. (превью-варианты)
        - Убирает /fit-in/.../ и другие трансформации, оставляя оригинал
        """
        if "cf.geekdo-images.com" not in url:
            return url

        # Извлекаем базовый хэш (до __) и имя файла
        # URL: .../HASH__TYPE/img/SIG/TRANSFORM/filename.jpg
        m = re.search(r'(cf\.geekdo-images\.com/)([^/_]+)(?:__[^/]+)?(/img/)[^/]+/[^/]*/([^/]+\.(?:jpg|jpeg|png|webp))', url)
        if m:
            # Собираем URL к оригиналу: HASH/filename
            return f"https://{m.group(1)}{m.group(2)}/{m.group(4)}"

        # Fallback: просто убираем fit-in/crop из URL
        url = re.sub(r'/fit-in/\d+x\d+/', '/', url)
        url = re.sub(r'/crop\d+/', '/', url)
        url = re.sub(r'/filters:[^/]+/', '/', url)
        return url

    def _is_low_quality_url(self, url: str) -> bool:
        """Отсеивает превьюшки и мелкие изображения BGG."""
        url_lower = url.lower()
        # Типы превьюшек — все __square*, __crop*, __thumb* и т.д.
        if re.search(r'__(?:square|crop|thumb|geeklistimagebar|microbadge)\d*', url_lower):
            return True
        return False

    def _download_and_save(
        self, game: BoardGame, url: str, index: int, total: int
    ) -> bool:
        url_path = url.split("?")[0]
        ext = ".jpg"
        for candidate in IMG_EXTENSIONS:
            if url_path.lower().endswith(candidate):
                ext = candidate
                break

        filename = f"img_{index:02d}{ext}"

        try:
            r = requests.get(url, headers={"User-Agent": UA, "Referer": "https://boardgamegeek.com/"}, timeout=30)
            if r.status_code != 200:
                self.stdout.write(f"    [{index + 1}/{total}] ❌ HTTP {r.status_code}: {url[:100]}")
                return False

            body = r.content
            if len(body) < 1000:
                self.stdout.write(f"    [{index + 1}/{total}] ⚠ Слишком маленькое ({len(body)} байт): {url[:80]}")
                return False

            if index == 0:
                image_type = GameImage.ImageType.COVER
            elif index == 1:
                image_type = GameImage.ImageType.BACKGROUND
            else:
                image_type = GameImage.ImageType.GALLERY

            game_image = GameImage(
                game=game,
                image_type=image_type,
                order=index,
                alt=f"{game.title} — фото {index + 1}",
            )
            game_image.image.save(filename, ContentFile(body), save=False)
            game_image.save()

            if index == 0 and not game.image:
                game.image.save(f"cover_{game.slug}{ext}", ContentFile(body), save=True)
                self.stdout.write(f"    [{index + 1}/{total}] ✅ cover → game.image")

            if index == 1 and not game.setup_image:
                game.setup_image.save(f"setup_{game.slug}{ext}", ContentFile(body), save=True)
                self.stdout.write(f"    [{index + 1}/{total}] ✅ bg → game.setup_image")

            self.stdout.write(f"    [{index + 1}/{total}] ✅ {image_type}: {filename}")
            return True

        except Exception as e:
            self.stdout.write(f"    [{index + 1}/{total}] ❌ {e}: {url[:80]}")
            return False