"""
Парсинг текстовых данных с BGG (категории, механики, описание) через отдельный Chrome.

Использует channel="chrome" + chrome_profile/ чтобы Cloudflare не беспокоил.

Использование:
    python manage.py scrape_bgg_text
    python manage.py scrape_bgg_text --limit 3
    python manage.py scrape_bgg_text --no-translate
"""

import json, os, time, re
from pathlib import Path
from django.core.management.base import BaseCommand

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
from boardgames.models import BoardGame, Category, Tag
from playwright.sync_api import sync_playwright

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"
PROFILE_DIR = Path("chrome_text_profile")


def slugify(text):
    from django.utils.text import slugify as _slug
    return _slug(text, allow_unicode=True)


class Command(BaseCommand):
    help = "Парсинг текстовых данных с BGG (категории, механики, описание)"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--headless", action="store_true", default=False)
        parser.add_argument("--no-translate", action="store_true", default=False)

    def handle(self, *args, **kwargs):
        limit = kwargs["limit"]
        headless = kwargs["headless"]
        no_translate = kwargs["no_translate"]

        games = BoardGame.objects.all()
        if limit:
            games = games[:limit]

        total = len(games)
        self.stdout.write(f"\nПарсинг текстовых данных для {total} игр")

        ok_cats = 0
        ok_tags = 0
        ok_desc = 0
        err = 0

        p = sync_playwright().start()
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            channel="chrome",
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        page = context.new_page()

        for idx, game in enumerate(games, 1):
            self.stdout.write(f"\n[{idx}/{total}] {game.title}")
            bgg_id = self._find_bgg_id(game)
            if not bgg_id:
                self.stdout.write("  ⏩ BGG ID не найден")
                continue

            try:
                url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
                page.goto(url, timeout=120000)
                # ждём загрузки контента
                try:
                    page.wait_for_selector(
                        "a[href*='/boardgamecategory/'], "
                        "script[type='application/ld+json'], "
                        ".game-description",
                        timeout=120000,
                    )
                except Exception:
                    pass
                time.sleep(2)

                # === JSON-LD (описание, название) ===
                desc_en = ""
                try:
                    ld = page.query_selector("script[type='application/ld+json']")
                    if ld:
                        data = json.loads(ld.inner_html())
                        if "BoardGame" in data.get("@type", ""):
                            desc_en = data.get("description", "") or ""
                            if data.get("name"):
                                self.stdout.write(f"  Название (en): {data['name']}")
                except Exception:
                    pass

                # Если JSON-LD не дал описания — берём из текста
                if not desc_en:
                    try:
                        desc_el = page.query_selector("[class*='description'], .game-description, article")
                        if desc_el:
                            desc_en = desc_el.inner_text().strip()
                    except Exception:
                        pass

                # === Категории ===
                cats = set()
                try:
                    for el in page.query_selector_all("a[href*='/boardgamecategory/']"):
                        t = el.inner_text().strip()
                        if t and len(t) < 100 and t not in ("Party", "Game", "Board Game"):
                            cats.add(t)
                except Exception:
                    pass

                # === Механики ===
                mechs = set()
                try:
                    for el in page.query_selector_all("a[href*='/boardgamemechanic/']"):
                        t = el.inner_text().strip()
                        if t and len(t) < 100:
                            mechs.add(t)
                except Exception:
                    pass

                # === Применяем к игре ===
                updated_cats = False
                updated_tags = False
                updated_desc = False

                if cats:
                    objs = []
                    for c in cats:
                        obj, _ = Category.objects.get_or_create(
                            name=c, defaults={"slug": slugify(c)}
                        )
                        objs.append(obj)
                    game.categories.set(objs)
                    updated_cats = True
                    ok_cats += 1

                if mechs:
                    objs = []
                    for m in mechs:
                        obj, _ = Tag.objects.get_or_create(
                            name=m, defaults={"slug": slugify(m)}
                        )
                        objs.append(obj)
                    game.tags.set(objs)
                    updated_tags = True
                    ok_tags += 1

                if desc_en:
                    # Сохраняем оригинал
                    game.description_en = desc_en
                    # Переводим
                    if not no_translate:
                        try:
                            from deep_translator import GoogleTranslator
                            translated = GoogleTranslator(source="en", target="ru").translate(desc_en[:5000])
                            if translated:
                                game.description_ru = translated
                        except Exception as e:
                            self.stdout.write(f"  ⚠ перевод: {e}")
                    updated_desc = True
                    ok_desc += 1
                    game.save()

                self.stdout.write(
                    f"  {'🏷️кат:' + str(len(cats)) if cats else ''}"
                    f"{' 🏷️мех:' + str(len(mechs)) if mechs else ''}"
                    f"{' 📝' if desc_en else ''}"
                )

            except Exception as e:
                err += 1
                self.stdout.write(f"  ⚠ {e}")

            time.sleep(1)

        context.close()
        p.stop()
        self.stdout.write(f"\n✅ Категории: {ok_cats} | Механики: {ok_tags} | Описания: {ok_desc} | Ошибок: {err}")

    def _find_bgg_id(self, game):
        from boardgames.management.commands.scrape_bgg_v2 import GAMES_MAP
        for ru, bgg_id in GAMES_MAP.items():
            if bgg_id and (ru.lower() in game.title.lower() or
                           slugify(ru) == game.slug):
                return bgg_id
        return None