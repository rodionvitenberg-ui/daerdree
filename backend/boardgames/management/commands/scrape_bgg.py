"""
Management command: Парсинг данных с BoardGameGeek через Playwright.
Использование:
    python manage.py scrape_bgg
    python manage.py scrape_bgg --limit 2
    python manage.py scrape_bgg --force
    python manage.py scrape_bgg --skip-images
"""

import os
import re
import time
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils.text import slugify

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

from boardgames.models import BoardGame, Category, Tag

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from playwright_stealth import stealth_sync

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


def parse_players(text: str) -> tuple[int, int]:
    text = text.strip().lower()
    nums = re.findall(r'\d+', text)
    if not nums:
        return (2, 4)
    if len(nums) == 1:
        return (int(nums[0]), int(nums[0]))
    return (int(nums[0]), int(nums[1]))


def parse_playtime(text: str) -> int:
    text = text.strip().lower()
    nums = re.findall(r'\d+', text)
    if not nums:
        return 30
    nums_int = [int(n) for n in nums]
    return sum(nums_int) // len(nums_int)


def parse_weight(text: str) -> float:
    match = re.search(r'([\d.]+)', text)
    if match:
        try:
            return float(match.group(1))
        except ValueError:
            pass
    return 2.0


def parse_bgg_type(url: str) -> str:
    if '/boardgameexpansion/' in url:
        return 'boardgameexpansion'
    return 'boardgame'


class Command(BaseCommand):
    help = "Парсинг данных с BoardGameGeek через Playwright"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--force", action="store_true", default=False)
        parser.add_argument("--skip-images", action="store_true", default=False)
        parser.add_argument("--headless", action="store_true", default=True)

    def handle(self, *args, **kwargs):
        limit = kwargs["limit"]
        force = kwargs["force"]
        skip_images = kwargs["skip_images"]
        headless = kwargs["headless"]

        self.stdout.write("=" * 60)
        self.stdout.write("  Парсер BoardGameGeek (Playwright)")
        self.stdout.write("=" * 60)

        game_titles = list(GAMES_MAP.keys())
        if limit:
            game_titles = game_titles[:limit]

        self.stdout.write(f"  Всего игр в списке: {len(GAMES_MAP)}")
        self.stdout.write(f"  Обрабатывается: {len(game_titles)}")
        self.stdout.write(f"  Режим force: {'ДА' if force else 'НЕТ'}")
        self.stdout.write(f"  Скачивать изображения: {'НЕТ' if skip_images else 'ДА'}")
        self.stdout.write(f"  Headless: {'ДА' if headless else 'НЕТ'}")
        self.stdout.write("=" * 60)

        created_count = 0
        updated_count = 0
        skipped_count = 0
        error_count = 0

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=headless)
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            )
            page = context.new_page()
            stealth_sync(page)

            for idx, title_ru in enumerate(game_titles, start=1):
                bgg_id = GAMES_MAP[title_ru]

                self.stdout.write(f"\n[{idx}/{len(game_titles)}] {title_ru}... ")
                self.stdout.flush()

                # ШАГ 1: Поиск BGG ID
                if bgg_id is None:
                    self.stdout.write("    Поиск BGG ID... ")
                    bgg_id = self._search_bgg_id(page, title_ru)
                    if bgg_id is None:
                        self.stdout.write(self.style.WARNING("⚠ ID не найден"))
                        error_count += 1
                        continue
                    GAMES_MAP[title_ru] = bgg_id
                    time.sleep(2)

                self.stdout.write(f"BGG#{bgg_id}... ")
                self.stdout.flush()

                # ШАГ 2: Парсим страницу
                data = self._scrape_game_page(page, bgg_id)
                if data is None:
                    self.stdout.write(self.style.WARNING("⚠ Ошибка парсинга"))
                    error_count += 1
                    continue

                # ШАГ 3: slug
                eng_title = data.get("title_primary") or title_ru
                slug = slugify_title(eng_title)

                # ШАГ 4: сложность
                difficulty = bgg_weight_to_difficulty(data.get("weight", 2.0))

                # ШАГ 5: категории
                cat_objects = []
                for cat_name in data.get("categories", []):
                    cat_slug = slugify(cat_name)
                    cat_obj, _ = Category.objects.get_or_create(
                        name=cat_name,
                        defaults={
                            "slug": cat_slug,
                            "description": f"Игры в жанре {cat_name}",
                        },
                    )
                    cat_objects.append(cat_obj)

                # ШАГ 6: теги
                tag_objects = []
                for tag_name in data.get("mechanics", []):
                    tag_slug = slugify(tag_name)
                    tag_obj, _ = Tag.objects.get_or_create(
                        name=tag_name, defaults={"slug": tag_slug}
                    )
                    tag_objects.append(tag_obj)

                # ШАГ 7: дизайнеры
                designers_str = ", ".join(data.get("designers", []))

                # ШАГ 8: описание
                description = data.get("description") or f"Описание для игры {title_ru}."

                # ШАГ 9: создаём/обновляем
                defaults = {
                    "slug": slug,
                    "description": description,
                    "min_players": data.get("min_players", 2),
                    "max_players": data.get("max_players", 4),
                    "play_time": data.get("play_time", 30),
                    "difficulty": difficulty,
                    "designer": designers_str,
                    "bgg_type": data.get("bgg_type", "boardgame"),
                    "is_active": True,
                }

                game, created = BoardGame.objects.get_or_create(
                    title=title_ru, defaults=defaults
                )

                if not created:
                    if force:
                        for field, value in defaults.items():
                            setattr(game, field, value)
                        game.save()
                        updated_count += 1
                        self.stdout.write("    🔄 обновлено")
                    else:
                        skipped_count += 1
                        self.stdout.write("    ⏩ уже есть (--force чтобы перезаписать)")
                else:
                    created_count += 1
                    self.stdout.write("    ✅ создано")

                game.categories.set(cat_objects)
                game.tags.set(tag_objects)

                # ШАГ 10: изображение
                if not skip_images and data.get("image_url"):
                    img_dir = Path("media") / "games" / slug
                    img_path = img_dir / "cover.jpg"
                    abs_path = os.path.join(os.getcwd(), str(img_path))

                    if not img_path.exists():
                        self.stdout.write("    📷 Скачиваю изображение... ")
                        success = self._download_image(data["image_url"], abs_path)
                        self.stdout.write("✅" if success else "⚠ ошибка")
                    else:
                        self.stdout.write("    📷 уже есть")
                elif not skip_images:
                    self.stdout.write("    📷 нет изображения")

                self.stdout.write(self.style.SUCCESS(" ✓"))
                time.sleep(1)

            browser.close()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  РЕЗУЛЬТАТЫ:")
        self.stdout.write(f"    Создано:   {created_count}")
        self.stdout.write(f"    Обновлено: {updated_count}")
        self.stdout.write(f"    Пропущено: {skipped_count}")
        self.stdout.write(f"    Ошибок:    {error_count}")
        self.stdout.write("=" * 60)

        if error_count > 0:
            self.stdout.write(self.style.WARNING(
                "\n⚠ Некоторые игры не были обработаны."
            ))

    # ──────────────────────────────────────────────
    #  МЕТОДЫ
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
        except (PlaywrightTimeout, Exception):
            pass
        return None

    def _scrape_game_page(self, page, bgg_id: int) -> dict | None:
        url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
        data = {
            "bgg_id": bgg_id,
            "title_primary": None,
            "min_players": 2,
            "max_players": 4,
            "play_time": 30,
            "weight": 2.0,
            "description": "",
            "image_url": None,
            "categories": [],
            "mechanics": [],
            "designers": [],
            "bgg_type": "boardgame",
        }

        try:
            page.goto(url, timeout=60000, wait_until="load")
        except Exception as e:
            self.stdout.write(f"\n    [WARN] Загрузка: {e}")
            # Пробуем второй раз
            try:
                page.goto(url, timeout=60000)
            except Exception as e2:
                self.stdout.write(f"\n    [WARN] Повторная загрузка: {e2}")
                return None

        # Ждём появления любого из важных элементов
        try:
            page.wait_for_selector(
                "h1, [class*='game-header'], [class*='game-info']",
                timeout=30000,
            )
        except PlaywrightTimeout:
            self.stdout.write("\n    [WARN] Контент не загрузился, пробую через HTML...")

        time.sleep(3)

        # Название (через Open Graph meta или через h1 в игровом заголовке)
        try:
            og_title = page.query_selector("meta[property='og:title']")
            if og_title:
                data["title_primary"] = og_title.get_attribute("content")
            else:
                # Пробуем h1 внутри game-header
                h1 = page.query_selector("[class*='game-header'] h1, .game-header-title h1")
                if h1:
                    data["title_primary"] = h1.inner_text().strip()
        except Exception:
            pass

        data["bgg_type"] = parse_bgg_type(page.url)

        # Собираем весь текст для парсинга
        all_text = ""
        for sel in [
            "[class*='game-info']",
            "[class*='info']",
            ".game-header-title-info",
            ".game-details",
        ]:
            try:
                for el in page.query_selector_all(sel):
                    all_text += el.inner_text() + "\n"
            except Exception:
                pass

        # Игроки
        m = re.search(r'(\d[\d–\-,& ]+\d?\s*Players)', all_text, re.IGNORECASE)
        if m:
            data["min_players"], data["max_players"] = parse_players(m.group(1))

        # Время
        m = re.search(r'(\d[\d–\-,& ]+\d?\s*Min(?:utes)?)', all_text, re.IGNORECASE)
        if m:
            data["play_time"] = parse_playtime(m.group(1))

        # Вес
        m = re.search(r'[Ww]eight[:\s]+([\d.]+)', all_text)
        if m:
            data["weight"] = parse_weight(m.group(0))

        # Категории
        cats = set()
        for sel in ["a[href*='/boardgamecategory/']", "[class*='category'] a"]:
            try:
                for link in page.query_selector_all(sel):
                    t = link.inner_text().strip()
                    if t and len(t) < 100:
                        cats.add(t)
            except Exception:
                pass
        data["categories"] = list(cats)

        # Механики
        mechs = set()
        for sel in ["a[href*='/boardgamemechanic/']", "[class*='mechanic'] a"]:
            try:
                for link in page.query_selector_all(sel):
                    t = link.inner_text().strip()
                    if t and len(t) < 100:
                        mechs.add(t)
            except Exception:
                pass
        data["mechanics"] = list(mechs)

        # Дизайнеры
        designers = set()
        for sel in ["a[href*='/boardgamedesigner/']", "[class*='designer'] a"]:
            try:
                for link in page.query_selector_all(sel):
                    t = link.inner_text().strip()
                    if t and len(t) < 200:
                        designers.add(t)
            except Exception:
                pass
        if not designers:
            m = re.search(r'(?:Designer|Created by)[:\s]+([A-Za-z ,.]+)', all_text)
            if m:
                designers.update(n.strip() for n in m.group(1).split(","))
        data["designers"] = list(designers)

        # Описание
        for sel in ["[class*='game-description']", "[class*='description']", ".description", "article"]:
            try:
                el = page.query_selector(sel)
                if el:
                    t = el.inner_text().strip()
                    if len(t) > 50:
                        data["description"] = t
                        break
            except Exception:
                pass

        # Изображение
        img_sel = [
            "img[class*='game-image']",
            "img[class*='game-header-image']",
            "img[alt*='box']",
            "[class*='game-image'] img",
            "picture source[type='image/webp']",
        ]
        for sel in img_sel:
            try:
                el = page.query_selector(sel)
                if el:
                    src = el.get_attribute("src")
                    if src:
                        data["image_url"] = src.split(",")[0].split(" ")[0].strip()
                        break
            except Exception:
                pass

        return data

    def _download_image(self, url: str, path: str) -> bool:
        import requests

        try:
            r = requests.get(
                url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; DaerdreeBot/1.0)"},
                timeout=30,
            )
            if r.status_code == 200:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                with open(path, "wb") as f:
                    f.write(r.content)
                return True
        except Exception as e:
            self.stdout.write(f"\n    [WARN] Скачивание: {e}")
        return False