"""Парсинг описаний с BGG для существующих игр. Использует словарь ID из scrape_bgg_v2."""
import json, os, time, re
from pathlib import Path
from django.core.management.base import BaseCommand

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
from boardgames.models import BoardGame
from playwright.sync_api import sync_playwright
from deep_translator import GoogleTranslator
from boardgames.management.commands.scrape_bgg_v2 import GAMES_MAP

PROFILE_DIR = Path("chrome_create_profile")


class Command(BaseCommand):
    help = "Парсинг описаний с BGG для существующих игр"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--headless", action="store_true", default=False)
        parser.add_argument("--no-translate", action="store_true", default=False)

    def handle(self, *args, **kwargs):
        limit = kwargs["limit"]
        headless = kwargs["headless"]
        no_translate = kwargs["no_translate"]

        games = BoardGame.objects.filter(description_en="")
        if limit:
            games = games[:limit]

        total = len(games)
        self.stdout.write(f"\nПарсинг описаний для {total} игр")
        ok = 0
        errors = 0

        p = sync_playwright().start()
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR), headless=headless, channel="chrome",
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        page = context.new_page()

        # Ожидание Cloudflare
        self.stdout.write("\n⏳ Ожидание Cloudflare (15 сек)...")
        self.stdout.flush()
        try:
            page.goto("https://boardgamegeek.com/", timeout=120000)
            for _ in range(3):
                time.sleep(5)
                if page.query_selector("a[href*='/boardgamecategory/'], input, .global-header"):
                    self.stdout.write("✅ Cloudflare пройден!")
                    self.stdout.flush()
                    break
        except Exception:
            pass
        time.sleep(2)

        for idx, game in enumerate(games, 1):
            self.stdout.write(f"\n[{idx}/{total}] {game.title}")
            self.stdout.flush()

            # Берём BGG ID из словаря
            bgg_id = None
            for name, bid in GAMES_MAP.items():
                if bid and (name.lower() in game.title.lower() or game.title.lower() in name.lower()):
                    bgg_id = bid
                    break

            if not bgg_id:
                errors += 1
                self.stdout.write("  ❌ ID не найден")
                continue

            self.stdout.write(f"  BGG#{bgg_id}")
            self.stdout.flush()

            try:
                page.goto(f"https://boardgamegeek.com/boardgame/{bgg_id}/", timeout=60000)
                time.sleep(3)

                # Извлекаем описание — 3 способа
                desc_en = ""
                try:
                    ld = page.query_selector("script[type='application/ld+json']")
                    if ld:
                        data = json.loads(ld.inner_html())
                        desc_en = data.get("description", "") or ""
                except Exception:
                    pass

                if not desc_en:
                    try:
                        meta = page.query_selector("meta[name='description']")
                        if meta:
                            desc_en = meta.get_attribute("content") or ""
                    except Exception:
                        pass

                if not desc_en:
                    try:
                        el = page.query_selector("[itemprop='description']")
                        if el:
                            desc_en = el.inner_text().strip()
                    except Exception:
                        pass

                if not desc_en:
                    try:
                        body_text = page.inner_text("body") or ""
                        m = re.search(r'Description\s*\n(.*?)(?=\n\s*[A-Z])', body_text, re.DOTALL)
                        if m:
                            desc_en = m.group(1).strip()
                    except Exception:
                        pass

                if desc_en:
                    game.description_en = desc_en
                    if not no_translate:
                        try:
                            translated = GoogleTranslator(source="en", target="ru").translate(desc_en[:5000])
                            if translated:
                                game.description_ru = translated
                        except Exception as e:
                            self.stdout.write(f"  ⚠ перевод: {e}")
                    game.save()
                    ok += 1
                    self.stdout.write(f"  ✅ {len(desc_en)} символов")
                else:
                    errors += 1
                    self.stdout.write("  ❌ описание не найдено")

            except Exception as e:
                errors += 1
                self.stdout.write(f"  ⚠ {e}")

            time.sleep(1.5)

        context.close()
        p.stop()
        self.stdout.write(f"\n✅ Описаний: {ok} | Ошибок: {errors}")