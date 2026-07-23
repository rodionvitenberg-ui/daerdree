"""
Management command: Полный парсинг данных с BGG через реальный Chrome.

Особенности:
  - Использует реальный Chrome (channel="chrome"), а не bundled Chromium
  - Cloudflare не блокирует реальный браузер
  - Профиль сохраняется в chrome_profile/ (капча проходится 1 раз навсегда)
  - Парсит категории, механики, тип через текст страницы
  - Скачивает изображения

Использование:
    python manage.py scrape_bgg_v3
    python manage.py scrape_bgg_v3 --slug concept
    python manage.py scrape_bgg_v3 --reset-session
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


def parse_section(text: str, section_name: str) -> list[str]:
    """Парсинг секции (Category/Mechanism/Type) из текста страницы."""
    pattern = re.compile(
        rf'{re.escape(section_name)}\s*\n((?:.+\n?)*?)(?=\n\n|\Z|^[A-Z])',
        re.MULTILINE | re.IGNORECASE
    )
    match = pattern.search(text)
    if not match:
        return []

    items = []
    for line in match.group(1).split('\n'):
        line = line.strip()
        if not line:
            continue
        if line.startswith('+') or line.startswith('Edit') or line.startswith('See'):
            continue
        if ':' in line and not line.startswith('http'):
            continue
        if line[0].isupper() and len(line) < 100:
            items.append(line)
    return items


class Command(BaseCommand):
    help = "Полный парсинг категорий/тегов/изображений с BGG (реальный Chrome)"

    def add_arguments(self, parser):
        parser.add_argument("--slug", type=str, default=None)
        parser.add_argument("--headless", action="store_true", default=False)
        parser.add_argument("--reset-session", action="store_true", default=False)

    def handle(self, *args, **kwargs):
        target_slug = kwargs["slug"]
        headless = kwargs["headless"]

        if kwargs["reset_session"]:
            import shutil
            if USER_DATA_DIR.exists():
                shutil.rmtree(str(USER_DATA_DIR))
                self.stdout.write("♻️ Профиль удалён. При запуске Chrome будет чистым.")

        games = BoardGame.objects.all()
        if target_slug:
            games = games.filter(slug=target_slug)
            if not games.exists():
                self.stdout.write(self.style.ERROR(f"Игра '{target_slug}' не найдена"))
                return

        total = games.count()
        self.stdout.write("=" * 60)
        self.stdout.write(f"  Обработка игр: {total}")
        self.stdout.write("=" * 60)

        img_ok = img_skip = img_err = 0
        cat_ok = cat_skip = 0

        with sync_playwright() as pw:
            # Запускаем реальный Chrome с постоянным профилем
            # Cloudflare видит обычный Chrome и не блокирует
            context = pw.chromium.launch_persistent_context(
                user_data_dir=str(USER_DATA_DIR),
                headless=headless,
                channel="chrome",
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox',
                ],
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
            )
            page = context.new_page()
            stealth_ctx = Stealth()
            stealth_ctx.apply_stealth_sync(page)

            for idx, game in enumerate(games, start=1):
                bgg_id = self._find_bgg_id(game)
                if not bgg_id:
                    self.stdout.write(f"\n[{idx}/{total}] {game.title} — BGG ID не найден")
                    continue

                self.stdout.write(f"\n[{idx}/{total}] {game.title} (BGG#{bgg_id})... ")
                self.stdout.flush()

                try:
                    url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
                    page.goto(url, timeout=60000, wait_until="load")
                    page.wait_for_timeout(3000)

                    # Даём время пройти капчу если это первая загрузка
                    if idx == 1:
                        try:
                            page.wait_for_selector(
                                "script[type='application/ld+json'], "
                                "a[href*='/boardgamecategory/']",
                                timeout=60000
                            )
                        except PlaywrightTimeout:
                            self.stdout.write(self.style.WARNING(
                                "\n  ⚠ Cloudflare? Ожидание ещё 60 сек..."
                            ))
                            page.wait_for_timeout(60000)

                    page.wait_for_timeout(2000)

                    # Текст страницы
                    body_text = page.inner_text("body") or ""

                    # Категории
                    cats = parse_section(body_text, "Category")
                    cats = [c for c in cats if c not in ("Party", "Game", "Board Game", "Edit", "Type", "Family")]

                    # Механики
                    mechs = parse_section(body_text, "Mechanism")

                    # Изображение
                    img_url = self._get_image_url(page)

                    # Применяем
                    updated = False

                    if cats:
                        cat_objs = []
                        for c in cats:
                            cs = slugify(c)
                            obj, _ = Category.objects.get_or_create(
                                name=c, defaults={"slug": cs, "description": f"Жанр {c}"}
                            )
                            cat_objs.append(obj)
                        game.categories.set(cat_objs)
                        updated = True

                    if mechs:
                        tag_objs = []
                        for m in mechs:
                            ms = slugify(m)
                            obj, _ = Tag.objects.get_or_create(
                                name=m, defaults={"slug": ms}
                            )
                            tag_objs.append(obj)
                        game.tags.set(tag_objs)
                        updated = True

                    if img_url and not game.image:
                        ok = self._download_image(context, img_url, game.slug)
                        if ok:
                            img_ok += 1
                        else:
                            img_err += 1
                    elif game.image:
                        img_skip += 1
                    else:
                        img_skip += 1

                    if updated:
                        cat_ok += 1

                    self.stdout.write(f"  {'📷' if img_url else '📷❌'} {'🏷️' if updated else '—'} "
                                      f"кат:{len(cats)} мех:{len(mechs)}")

                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"\n  ⚠ Ошибка: {e}"))

                time.sleep(2)

            context.close()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  ИТОГИ:")
        self.stdout.write(f"    Изображений: {img_ok} (+{img_skip} пропущено, {img_err} ошибок)")
        self.stdout.write(f"    Категории/теги обновлены у {cat_ok} игр")
        self.stdout.write("=" * 60)

    # ──────────────────────────────────────────────

    def _find_bgg_id(self, game: BoardGame) -> int | None:
        from boardgames.management.commands.scrape_bgg_v2 import GAMES_MAP
        for title_ru, bgg_id in GAMES_MAP.items():
            if bgg_id and (title_ru.lower() in game.title.lower() or
                           slugify_title(title_ru) == game.slug):
                return bgg_id
        return None

    def _get_image_url(self, page) -> str | None:
        try:
            for s in page.query_selector_all("script[type='application/ld+json']"):
                raw = s.inner_html()
                parsed = json.loads(raw)
                if "BoardGame" in parsed.get("@type", "") and parsed.get("image"):
                    return parsed["image"]
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
        img_dir = Path("media") / "games" / slug
        img_path = img_dir / "cover.jpg"
        abs_path = os.path.join(os.getcwd(), str(img_path))
        if img_path.exists():
            return True
        os.makedirs(img_dir, exist_ok=True)
        try:
            resp = context.request.get(url, timeout=30000)
            if resp.status == 200 and len(resp.body()) > 1000:
                with open(abs_path, "wb") as f:
                    f.write(resp.body())
                return True
        except Exception:
            pass
        return False