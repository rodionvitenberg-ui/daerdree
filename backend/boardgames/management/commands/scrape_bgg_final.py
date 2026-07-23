"""
Management command: Парсинг категорий/тегов/изображений через Playwright + реальный Chrome.

cloudflare обходится за счёт:
  1. Реальный Chrome из системы (channel="chrome")
  2. Постоянный профиль chrome_profile/ (Cloudflare капча проходится 1 раз)

Использование:
    python manage.py scrape_bgg_final
    python manage.py scrape_bgg_final --slug concept
    python manage.py scrape_bgg_final --reset-session
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


USER_DATA_DIR = Path("chrome_profile")


def slugify_title(title: str) -> str:
    return slugify(title, allow_unicode=True)


class Command(BaseCommand):
    help = "Парсинг категорий/тегов/изображений с BGG (реальный Chrome + профиль)"

    def add_arguments(self, parser):
        parser.add_argument("--slug", type=str, default=None)
        parser.add_argument("--headless", action="store_true", default=False)
        parser.add_argument("--reset-session", action="store_true", default=False)

    def handle(self, *args, **kwargs):
        target_slug = kwargs["slug"]

        if kwargs["reset_session"]:
            import shutil
            if USER_DATA_DIR.exists():
                shutil.rmtree(str(USER_DATA_DIR))
                self.stdout.write("♻️ Профиль удалён")
                return

        games = BoardGame.objects.all()
        if target_slug:
            games = games.filter(slug=target_slug)
            if not games.exists():
                self.stdout.write(self.style.ERROR(f"Игра '{target_slug}' не найдена"))
                return

        total = games.count()
        self.stdout.write("=" * 60)
        self.stdout.write(f"  Парсинг {total} игр (реальный Chrome + профиль)")
        self.stdout.write("=" * 60)

        img_ok = img_skip = img_err = 0
        cat_ok = 0

        with sync_playwright() as pw:
            # Реальный Chrome с постоянным профилем
            context = pw.chromium.launch_persistent_context(
                user_data_dir=str(USER_DATA_DIR),
                headless=kwargs["headless"],
                channel="chrome",
                args=['--disable-blink-features=AutomationControlled'],
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            )
            page = context.new_page()
            Stealth().apply_stealth_sync(page)

            for idx, game in enumerate(games, start=1):
                bgg_id = self._find_bgg_id(game)
                if not bgg_id:
                    self.stdout.write(f"\n[{idx}/{total}] {game.title} — ID не найден")
                    continue

                self.stdout.write(f"\n[{idx}/{total}] {game.title} (BGG#{bgg_id})... ")
                self.stdout.flush()

                try:
                    page.goto(
                        f"https://boardgamegeek.com/boardgame/{bgg_id}/",
                        timeout=60000,
                    )

                    # Ожидание загрузки (60 сек на случай капчи)
                    try:
                        page.wait_for_selector(
                            "a[href*='/boardgamecategory/'], "
                            "script[type='application/ld+json']",
                            timeout=60000,
                        )
                    except PlaywrightTimeout:
                        self.stdout.write("  ⏳ Долгая загрузка, жду ещё...")
                        page.wait_for_timeout(30000)

                    page.wait_for_timeout(2000)

                    # Парсинг из текста
                    text = page.inner_text("body") or ""

                    cats = self._parse_categories(text)
                    mechs = self._parse_mechanics(text)
                    img_url = self._get_image_url(page)

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
                        ok = self._download_image(context, img_url, game.slug)
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

                time.sleep(2)

            context.close()

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

    def _parse_categories(self, text: str) -> list[str]:
        """Парсинг категорий из текста: ищем блок Category...Mechanism"""
        m = re.search(r'Category\s*\n(.*?)(?=\n\s*[A-Z])', text, re.DOTALL)
        if not m:
            return []
        items = []
        for line in m.group(1).split('\n'):
            line = line.strip()
            if line and line[0].isupper() and ':' not in line and len(line) < 60:
                items.append(line)
        return items

    def _parse_mechanics(self, text: str) -> list[str]:
        """Парсинг механик: ищем блок Mechanism...Category (или конец)"""
        m = re.search(r'Mechanism\s*\n(.*?)(?=\n\s*[A-Z])', text, re.DOTALL)
        if not m:
            return []
        items = []
        for line in m.group(1).split('\n'):
            line = line.strip()
            if line and line[0].isupper() and ':' not in line and len(line) < 60:
                items.append(line)
        return items

    def _get_image_url(self, page) -> str | None:
        try:
            ld = page.query_selector("script[type='application/ld+json']")
            if ld:
                data = json.loads(ld.inner_html())
                if data.get("image"):
                    return data["image"]
        except Exception:
            pass
        try:
            og = page.query_selector("meta[property='og:image']")
            if og:
                return og.get_attribute("content")
        except Exception:
            pass
        return None

    def _download_image(self, context, url: str, slug: str) -> bool:
        p = Path("media") / "games" / slug / "cover.jpg"
        if p.exists():
            return True
        p.parent.mkdir(parents=True, exist_ok=True)
        try:
            resp = context.request.get(url, timeout=30000)
            if resp.status == 200 and len(resp.body()) > 1000:
                p.write_bytes(resp.body())
                return True
        except Exception:
            pass
        return False