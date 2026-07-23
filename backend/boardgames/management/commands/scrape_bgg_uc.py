"""
Management command: Парсинг категорий/тегов/изображений с BGG через undetected-chromedriver.

undetected-chromedriver патчит Chrome на глубинном уровне, обходя Cloudflare.

Использование:
    python manage.py scrape_bgg_uc
    python manage.py scrape_bgg_uc --limit 3
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

import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def slugify_title(title: str) -> str:
    return slugify(title, allow_unicode=True)


class Command(BaseCommand):
    help = "Парсинг BGG через undetected-chromedriver (обходит Cloudflare)"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--headless", action="store_true", default=False)

    def handle(self, *args, **kwargs):
        limit = kwargs["limit"]
        headless = kwargs["headless"]

        games = BoardGame.objects.all()
        if limit:
            games = games[:limit]

        total = games.count()
        self.stdout.write("=" * 60)
        self.stdout.write(f"  Парсинг {total} игр (undetected-chromedriver)")
        self.stdout.write("=" * 60)

        img_ok = img_skip = img_err = 0
        cat_ok = 0

        driver = uc.Chrome(
            headless=headless,
            use_subprocess=True,
            version_main=150,
        )

        for idx, game in enumerate(games, start=1):
            bgg_id = self._find_bgg_id(game)
            if not bgg_id:
                self.stdout.write(f"\n[{idx}/{total}] {game.title} — ID не найден")
                continue

            self.stdout.write(f"\n[{idx}/{total}] {game.title} (BGG#{bgg_id})... ")
            self.stdout.flush()

            try:
                driver.get(f"https://boardgamegeek.com/boardgame/{bgg_id}/")
                time.sleep(3)

                # Ждём загрузки контента
                WebDriverWait(driver, 30).until(
                    EC.presence_of_element_located((By.TAG_NAME, "body"))
                )
                time.sleep(2)

                html = driver.page_source
                text = driver.find_element(By.TAG_NAME, "body").text

                # Парсинг категорий
                cats = self._parse_from_text(text, "Category")
                # Парсинг механик
                mechs = self._parse_from_text(text, "Mechanism")

                # Изображение
                img_url = self._find_image(html)

                # Применяем
                updated = False

                if cats:
                    objs = []
                    for c in cats:
                        obj, _ = Category.objects.get_or_create(
                            name=c, defaults={"slug": slugify(c)}
                        )
                        objs.append(obj)
                    game.categories.set(objs)
                    updated = True

                if mechs:
                    objs = []
                    for m in mechs:
                        obj, _ = Tag.objects.get_or_create(
                            name=m, defaults={"slug": slugify(m)}
                        )
                        objs.append(obj)
                    game.tags.set(objs)
                    updated = True

                if img_url and not game.image:
                    ok = self._download_image(img_url, game.slug)
                    if ok:
                        img_ok += 1
                    else:
                        img_err += 1
                else:
                    img_skip += 1

                if updated:
                    cat_ok += 1

                self.stdout.write(f"  {'📷' if img_url else '📷❌'} "
                                  f"категории:{len(cats)} механики:{len(mechs)}"
                                  f"{' 🏷️' if updated else ''}")

            except Exception as e:
                self.stdout.write(self.style.WARNING(f"\n  ⚠ {e}"))

        driver.quit()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  ИТОГИ:")
        self.stdout.write(f"    Изображений: {img_ok} ({img_skip} пропущено, {img_err} ошибок)")
        self.stdout.write(f"    С обновлёнными категориями/тегами: {cat_ok}")
        self.stdout.write("=" * 60)

    # ──────────────────────────────────────────────

    def _find_bgg_id(self, game: BoardGame) -> int | None:
        from boardgames.management.commands.scrape_bgg_v2 import GAMES_MAP
        for title_ru, bgg_id in GAMES_MAP.items():
            if bgg_id and title_ru.lower() in game.title.lower():
                return bgg_id
        return None

    def _parse_from_text(self, text: str, section: str) -> list[str]:
        """Парсинг секции Category или Mechanism из текста страницы."""
        m = re.search(rf'{section}\s*\n(.*?)(?=\n\s*[A-Z])', text, re.DOTALL)
        if not m:
            return []
        items = []
        for line in m.group(1).split('\n'):
            line = line.strip()
            if line and line[0].isupper() and ':' not in line and len(line) < 60:
                items.append(line)
        return items

    def _find_image(self, html: str) -> str | None:
        for pattern in [
            r'<meta[^>]*property="og:image"[^>]*content="([^"]+)"',
            r'<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"',
        ]:
            m = re.search(pattern, html)
            if m:
                return m.group(1)
        try:
            ld_pattern = r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>'
            for m in re.finditer(ld_pattern, html, re.DOTALL):
                data = json.loads(m.group(1))
                if data.get("image"):
                    return data["image"]
        except Exception:
            pass
        return None

    def _download_image(self, url: str, slug: str) -> bool:
        p = Path("media") / "games" / slug / "cover.jpg"
        if p.exists():
            return True
        p.parent.mkdir(parents=True, exist_ok=True)
        try:
            import requests
            r = requests.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": "https://boardgamegeek.com/",
            }, timeout=30)
            if r.status_code == 200 and len(r.content) > 1000:
                p.write_bytes(r.content)
                return True
        except Exception:
            pass
        return False