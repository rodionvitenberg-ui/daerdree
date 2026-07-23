"""
Management command: Парсинг данных с BoardGameGeek через Playwright + JSON-LD.
Использование:
    python manage.py scrape_bgg_v2
    python manage.py scrape_bgg_v2 --limit 5
    python manage.py scrape_bgg_v2 --debug-game 147151
"""

import json
import os
import re
import time
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils.text import slugify

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

from boardgames.models import BoardGame, Category, Tag

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from playwright_stealth import Stealth

from deep_translator import GoogleTranslator

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


def slugify_title(title: str) -> str:
    return slugify(title, allow_unicode=True)


def bgg_weight_to_difficulty(weight: float) -> int:
    if weight < 1.5:
        return 1
    elif weight < 2.5:
        return 2
    elif weight < 3.5:
        return 3
    elif weight < 4.5:
        return 4
    else:
        return 5


def translate_text(text: str, max_len: int = 5000) -> str:
    """Перевод текста с английского на русский через deep-translator."""
    if not text or len(text.strip()) < 20:
        return text
    # deep-translator имеет лимит ~5000 символов, режем если надо
    chunk = text[:max_len]
    try:
        translated = GoogleTranslator(source="en", target="ru").translate(chunk)
        return translated or text
    except Exception as e:
        print(f"  [WARN] Ошибка перевода: {e}")
        return text


class Command(BaseCommand):
    help = "Парсинг BoardGameGeek через Playwright + JSON-LD"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--force", action="store_true", default=False)
        parser.add_argument("--skip-images", action="store_true", default=False)
        parser.add_argument("--headless", action="store_true", default=True)
        parser.add_argument("--debug-game", type=int, default=None,
                            help="BGG ID для отладки: вывести JSON-LD и данные")

    def handle(self, *args, **kwargs):
        limit = kwargs["limit"]
        force = kwargs["force"]
        skip_images = kwargs["skip_images"]
        headless = kwargs["headless"]
        debug_game = kwargs["debug_game"]

        # Если включён дебаг — показываем одну игру и выходим
        if debug_game:
            self._debug_game(debug_game, headless)
            return

        self.stdout.write("=" * 60)
        self.stdout.write("  Парсер BoardGameGeek v2 (JSON-LD)")
        self.stdout.write("=" * 60)

        game_titles = list(GAMES_MAP.keys())
        if limit:
            game_titles = game_titles[:limit]

        self.stdout.write(f"  Всего: {len(GAMES_MAP)}")
        self.stdout.write(f"  Обрабатывается: {len(game_titles)}")
        self.stdout.write(f"  Force: {force}")
        self.stdout.write(f"  Изображения: {'НЕТ' if skip_images else 'ДА'}")
        self.stdout.write("=" * 60)

        created = 0
        updated = 0
        skipped = 0
        errors = 0

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=headless)
            ctx = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            )
            page = ctx.new_page()
            stealth_ctx = Stealth()
            stealth_ctx.apply_stealth_sync(page)

            for idx, title_ru in enumerate(game_titles, start=1):
                bgg_id = GAMES_MAP[title_ru]

                self.stdout.write(f"\n[{idx}/{len(game_titles)}] {title_ru}... ")
                self.stdout.flush()

                # Поиск ID
                if bgg_id is None:
                    self.stdout.write("  Поиск ID... ")
                    bgg_id = self._search_bgg_id(page, title_ru)
                    if bgg_id is None:
                        self.stdout.write(self.style.WARNING("⚠ не найден"))
                        errors += 1
                        continue
                    GAMES_MAP[title_ru] = bgg_id
                    time.sleep(2)

                self.stdout.write(f"BGG#{bgg_id}... ")
                self.stdout.flush()

                # Парсинг
                data = self._scrape_game(page, bgg_id)
                if data is None:
                    self.stdout.write(self.style.WARNING("⚠ ошибка"))
                    errors += 1
                    continue

                eng_title = data.get("title_en", title_ru)
                slug = slugify_title(eng_title)
                # Гарантируем уникальность slug
                base_slug = slug
                slug_counter = 1
                while BoardGame.objects.filter(slug=slug).exists():
                    slug = f"{base_slug}-{slug_counter}"
                    slug_counter += 1

                difficulty = bgg_weight_to_difficulty(data.get("weight", 2.0))

                # Категории
                cat_objs = []
                for c in data.get("categories", []):
                    cs = slugify(c)
                    o, _ = Category.objects.get_or_create(
                        name=c, defaults={"slug": cs, "description": f"Жанр {c}"}
                    )
                    cat_objs.append(o)

                # Теги
                tag_objs = []
                for t in data.get("mechanics", []):
                    ts = slugify(t)
                    o, _ = Tag.objects.get_or_create(
                        name=t, defaults={"slug": ts}
                    )
                    tag_objs.append(o)

                designers = ", ".join(data.get("designers", []))

                # Описание: оригинал (en) + перевод (ru)
                desc_en = data.get("description_en", "")
                desc_ru = data.get("description_ru", "")

                defaults = {
                    "slug": slug,
                    "description_en": desc_en,
                    "description_ru": desc_ru,
                    "min_players": data.get("min_players", 2),
                    "max_players": data.get("max_players", 4),
                    "play_time": data.get("play_time", 30),
                    "difficulty": difficulty,
                    "designer": designers,
                    "bgg_type": data.get("bgg_type", "boardgame"),
                    "is_active": True,
                }

                # Создаём с русским названием как основное
                game, is_new = BoardGame.objects.get_or_create(
                    title_ru=title_ru, defaults=defaults
                )

                if not is_new and force:
                    for f, v in defaults.items():
                        setattr(game, f, v)
                    game.save()

                if is_new:
                    created += 1
                    self.stdout.write("  ✅ создано")
                elif force:
                    updated += 1
                    self.stdout.write("  🔄 обновлено")
                else:
                    skipped += 1
                    self.stdout.write("  ⏩ уже есть")

                game.categories.set(cat_objs)
                game.tags.set(tag_objs)

                # Изображение
                if not skip_images and data.get("image_url"):
                    img_dir = Path("media") / "games" / slug
                    img_path = img_dir / "cover.jpg"
                    abs_path = os.path.join(os.getcwd(), str(img_path))
                    if not img_path.exists():
                        self.stdout.write("  📷 Скачиваю... ")
                        ok = self._download_image(data["image_url"], abs_path)
                        self.stdout.write("✅" if ok else "⚠")
                    else:
                        self.stdout.write("  📷 уже есть")
                elif not skip_images:
                    self.stdout.write("  📷 нет")

                time.sleep(1)

            browser.close()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  ИТОГИ:")
        self.stdout.write(f"    Создано:   {created}")
        self.stdout.write(f"    Обновлено: {updated}")
        self.stdout.write(f"    Пропущено: {skipped}")
        self.stdout.write(f"    Ошибок:    {errors}")
        self.stdout.write("=" * 60)

    # ──────────────────────────────────────────────
    #  DEBUG
    # ──────────────────────────────────────────────

    def _debug_game(self, bgg_id: int, headless: bool):
        """Отладка: вывести JSON-LD и структуру страницы."""
        self.stdout.write(f"\n🔍 Debug игры BGG#{bgg_id}\n")

        with sync_playwright() as pw:
            b = pw.chromium.launch(headless=headless)
            ctx = b.new_context()
            p = ctx.new_page()
            stealth_ctx = Stealth()
            stealth_ctx.apply_stealth_sync(p)

            url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
            try:
                p.goto(url, timeout=60000)
                p.wait_for_timeout(5000)
            except Exception as e:
                self.stdout.write(f"Ошибка загрузки: {e}")
                return

            # JSON-LD
            scripts = p.query_selector_all("script[type='application/ld+json']")
            self.stdout.write(f"Найдено JSON-LD скриптов: {len(scripts)}\n")
            for i, s in enumerate(scripts):
                try:
                    content = s.inner_html()
                    data = json.loads(content)
                    self.stdout.write(f"--- JSON-LD #{i + 1} ---")
                    self.stdout.write(json.dumps(data, indent=2, ensure_ascii=False)[:2000])
                    self.stdout.write("")
                except Exception as e:
                    self.stdout.write(f"  Ошибка парсинга JSON-LD: {e}")

            # H1
            h1 = p.query_selector("h1")
            if h1:
                self.stdout.write(f"\nh1 текст: {h1.inner_text().strip()}")

            # OG Title
            og = p.query_selector("meta[property='og:title']")
            if og:
                self.stdout.write(f"og:title: {og.get_attribute('content')}")

            # Все ссылки на категории
            cats = p.query_selector_all("a[href*='/boardgamecategory/']")
            self.stdout.write(f"\nКатегории (ссылок): {len(cats)}")
            for c in cats[:10]:
                self.stdout.write(f"  - {c.inner_text().strip()}")

            mechs = p.query_selector_all("a[href*='/boardgamemechanic/']")
            self.stdout.write(f"Механики (ссылок): {len(mechs)}")
            for m in mechs[:10]:
                self.stdout.write(f"  - {m.inner_text().strip()}")

            des = p.query_selector_all("a[href*='/boardgamedesigner/']")
            self.stdout.write(f"Дизайнеры (ссылок): {len(des)}")

            self.stdout.write("\n✅ Отладка завершена")
            b.close()

    # ──────────────────────────────────────────────
    #  ПОИСК ID
    # ──────────────────────────────────────────────

    def _search_bgg_id(self, page, title: str) -> int | None:
        url = f"https://boardgamegeek.com/search/boardgame?q={title}"
        try:
            page.goto(url, timeout=30000)
            page.wait_for_selector("a[href*='/boardgame/']", timeout=15000)
            link = page.query_selector("a[href*='/boardgame/']")
            if link:
                href = link.get_attribute("href")
                m = re.search(r'/boardgame(?:expansion)?/(\d+)', href or "")
                if m:
                    return int(m.group(1))
        except Exception:
            pass
        return None

    # ──────────────────────────────────────────────
    #  ПАРСИНГ СТРАНИЦЫ
    # ──────────────────────────────────────────────

    def _scrape_game(self, page, bgg_id: int) -> dict | None:
        url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
        data = {
            "title_en": None,
            "description_en": "",
            "description_ru": "",
            "min_players": 2,
            "max_players": 4,
            "play_time": 30,
            "weight": 2.0,
            "image_url": None,
            "categories": [],
            "mechanics": [],
            "designers": [],
            "bgg_type": "boardgame",
        }

        try:
            page.goto(url, timeout=60000, wait_until="load")
        except Exception as e:
            self.stdout.write(f"\n  [WARN] Загрузка: {e}")
            try:
                page.goto(url, timeout=60000)
            except Exception:
                return None

        try:
            page.wait_for_selector("h1, script[type='application/ld+json']", timeout=30000)
        except PlaywrightTimeout:
            pass

        time.sleep(3)

        # === JSON-LD ===
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for script in scripts:
                raw = script.inner_html()
                parsed = json.loads(raw)
                self._parse_ld_json(parsed, data)
        except Exception:
            pass

        # === Название — цепочка fallback'ов ===
        if not data["title_en"]:
            # og:title
            og = page.query_selector("meta[property='og:title']")
            if og:
                val = og.get_attribute("content")
                if val and "boardgamegeek" not in val.lower():
                    data["title_en"] = val

        if not data["title_en"]:
            # Первый h1 (исключая BGG-заголовки)
            h1 = page.query_selector("h1")
            if h1:
                val = h1.inner_text().strip()
                if val and "boardgamegeek" not in val.lower() and len(val) < 200:
                    data["title_en"] = val

        if not data["title_en"]:
            # <title> страницы
            title_tag = page.query_selector("title")
            if title_tag:
                val = title_tag.inner_text().strip()
                # BGG title: "Concept | Board Game | BoardGameGeek"
                parts = val.split("|")
                if parts:
                    data["title_en"] = parts[0].strip()

        # === Категории, механики, дизайнеры ===
        # Категории
        cats = set()
        for sel in ["a[href*='/boardgamecategory/']"]:
            try:
                for el in page.query_selector_all(sel):
                    t = el.inner_text().strip()
                    if t and len(t) < 100 and t not in ("Party", "Game", "Board Game"):
                        cats.add(t)
            except Exception:
                pass
        data["categories"] = list(cats)

        # Механики
        mechs = set()
        for sel in ["a[href*='/boardgamemechanic/']"]:
            try:
                for el in page.query_selector_all(sel):
                    t = el.inner_text().strip()
                    if t and len(t) < 100:
                        mechs.add(t)
            except Exception:
                pass
        data["mechanics"] = list(mechs)

        # Дизайнеры
        des = set()
        for sel in ["a[href*='/boardgamedesigner/']"]:
            try:
                for el in page.query_selector_all(sel):
                    t = el.inner_text().strip()
                    if t and len(t) < 200:
                        des.add(t)
            except Exception:
                pass
        data["designers"] = list(des)

        # === Тип ===
        data["bgg_type"] = "boardgameexpansion" if "/boardgameexpansion/" in page.url else "boardgame"

        # === Изображение ===
        if not data["image_url"]:
            for sel in [
                "img[class*='game-image']",
                "img[class*='game-header']",
                "picture source[type='image/webp']",
            ]:
                try:
                    el = page.query_selector(sel)
                    if el:
                        src = el.get_attribute("src")
                        if src:
                            data["image_url"] = src.split(",")[0].split(" ")[0].strip()
                            break
                except Exception:
                    pass

        # === Описание: если есть en, переводим ===
        if data["description_en"]:
            self.stdout.write(f"\n    📝 Перевод описания... ")
            data["description_ru"] = translate_text(data["description_en"])
            self.stdout.write("✅")

        return data

    def _parse_ld_json(self, parsed: dict, data: dict):
        """Извлечение данных из JSON-LD структуры."""
        atype = parsed.get("@type", "")
        if "BoardGame" not in atype:
            return

        # Название
        name = parsed.get("name", "")
        if name:
            data["title_en"] = name

        # Описание
        desc = parsed.get("description", "")
        if desc:
            data["description_en"] = desc

        # Игроки
        players = parsed.get("numberOfPlayers", {})
        if isinstance(players, dict):
            data["min_players"] = players.get("minValue", 2)
            data["max_players"] = players.get("maxValue", 4)

        # Время (ISO 8601: PT45M)
        time_val = parsed.get("timeRequired", "")
        if time_val:
            match = re.search(r'PT?(\d+)(?:H|M)', time_val)
            if match:
                data["play_time"] = int(match.group(1))

        # Изображение
        img = parsed.get("image", "")
        if img:
            data["image_url"] = img

    # ──────────────────────────────────────────────
    #  СКАЧИВАНИЕ
    # ──────────────────────────────────────────────

    def _download_image(self, url: str, path: str) -> bool:
        import requests
        try:
            r = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (compatible; DaerdreeBot/1.0)"
            }, timeout=30)
            if r.status_code == 200:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "wb") as f:
                    f.write(r.content)
                return True
        except Exception as e:
            self.stdout.write(f"\n  [WARN] Скачивание: {e}")
        return False