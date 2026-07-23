"""
Management command: Докачка изображений и обновление категорий/тегов для существующих игр.

Использование:
    python manage.py scrape_bgg_images                    # все игры
    python manage.py scrape_bgg_images --slug camel-up    # одна игра
    python manage.py scrape_bgg_images --headless         # скрытый браузер
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


def slugify_title(title: str) -> str:
    return slugify(title, allow_unicode=True)


class Command(BaseCommand):
    help = "Скачивание изображений и обновление категорий/тегов с BGG"

    def add_arguments(self, parser):
        parser.add_argument("--slug", type=str, default=None,
                            help="Slug конкретной игры (опционально)")
        parser.add_argument("--headless", action="store_true", default=False,
                            help="Режим без графики (по умолчанию браузер показан)")

    def handle(self, *args, **kwargs):
        target_slug = kwargs["slug"]
        headless = kwargs["headless"]

        # Получаем игры
        if target_slug:
            games = BoardGame.objects.filter(slug=target_slug)
            if not games.exists():
                self.stdout.write(self.style.ERROR(f"Игра со slug '{target_slug}' не найдена"))
                return
        else:
            games = BoardGame.objects.all()

        total = games.count()
        self.stdout.write("=" * 60)
        self.stdout.write(f"  Обработка игр: {total}")
        self.stdout.write(f"  Браузер: {'скрытый' if headless else 'видимый'}")
        self.stdout.write("=" * 60)

        img_ok = 0
        img_skip = 0
        img_err = 0
        cat_ok = 0
        cat_err = 0

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=headless)
            ctx = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                )
            )
            page = ctx.new_page()
            stealth_ctx = Stealth()
            stealth_ctx.apply_stealth_sync(page)

            for idx, game in enumerate(games, start=1):
                bgg_id = self._find_bgg_id(game)
                if not bgg_id:
                    self.stdout.write(f"\n[{idx}/{total}] {game.title} — BGG ID не найден, пропуск")
                    continue

                self.stdout.write(f"\n[{idx}/{total}] {game.title} (BGG#{bgg_id})... ")
                self.stdout.flush()

                try:
                    url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
                    page.goto(url, timeout=60000, wait_until="load")
                    page.wait_for_timeout(3000)

                    # Пытаемся дождаться загрузки
                    try:
                        page.wait_for_selector(
                            "script[type='application/ld+json'], meta[property='og:image'], img",
                            timeout=20000
                        )
                    except PlaywrightTimeout:
                        pass

                    page.wait_for_timeout(2000)

                    # === 1. Скачивание изображения ===
                    if not game.image:
                        img_url = self._get_image_url(page)
                        if img_url:
                            ok = self._download_image_via_browser(page, img_url, game.slug)
                            if ok:
                                img_ok += 1
                                self.stdout.write("  📷 загружено")
                            else:
                                self.stdout.write("  📷 ошибка скачивания")
                                img_err += 1
                        else:
                            img_skip += 1
                            self.stdout.write("  📷 URL не найден")
                    else:
                        img_skip += 1
                        self.stdout.write("  📷 уже есть")

                    # === 2. Категории и теги ===
                    cats, mechs, des = self._get_page_metadata(page)
                    updated = False

                    if cats and not game.categories.exists():
                        cat_objs = []
                        for c in cats:
                            cs = slugify(c)
                            obj, _ = Category.objects.get_or_create(
                                name=c, defaults={"slug": cs, "description": f"Жанр {c}"}
                            )
                            cat_objs.append(obj)
                        game.categories.set(cat_objs)
                        cat_ok += 1
                        updated = True

                    if mechs and not game.tags.exists():
                        tag_objs = []
                        for t in mechs:
                            ts = slugify(t)
                            obj, _ = Tag.objects.get_or_create(
                                name=t, defaults={"slug": ts}
                            )
                            tag_objs.append(obj)
                        game.tags.set(tag_objs)
                        cat_ok += 1
                        updated = True

                    if updated:
                        self.stdout.write("  🏷️ категории/теги обновлены")
                    else:
                        cats_now = game.categories.count()
                        tags_now = game.tags.count()
                        self.stdout.write(f"  🏷️ {cats_now} кат., {tags_now} тегов")

                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"\n  ⚠ Ошибка: {e}"))
                    cat_err += 1

                time.sleep(2)

            browser.close()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  ИТОГИ:")
        self.stdout.write(f"    Загружено изображений: {img_ok}")
        self.stdout.write(f"    Пропущено (уже есть): {img_skip}")
        self.stdout.write(f"    Ошибок изображений:   {img_err}")
        self.stdout.write(f"    Категории/теги:       {cat_ok}")
        self.stdout.write("=" * 60)

    # ──────────────────────────────────────────────
    #  МЕТОДЫ
    # ──────────────────────────────────────────────

    def _find_bgg_id(self, game: BoardGame) -> int | None:
        """Поиск BGG ID: по designer/bgg_type или по slug (название на английском)."""
        # Пробуем взять slug — это английское название в транслите
        eng_name = game.slug.replace("-", " ").title()
        # Если в игре есть bgg_id как дополнительное поле (его нет, увы)
        # Используем внешний словарь из scrape_bgg_v2
        from boardgames.management.commands.scrape_bgg_v2 import GAMES_MAP

        for title_ru, bgg_id in GAMES_MAP.items():
            if bgg_id and title_ru.lower() in game.title.lower():
                return bgg_id

        # Поиск по английскому названию (через slug)
        for title_ru, bgg_id in GAMES_MAP.items():
            slug_candidate = slugify_title(title_ru)
            if slug_candidate == game.slug:
                return bgg_id

        return None

    def _get_image_url(self, page) -> str | None:
        """Поиск URL изображения через JSON-LD → og:image → img."""
        # JSON-LD
        try:
            scripts = page.query_selector_all("script[type='application/ld+json']")
            for s in scripts:
                raw = s.inner_html()
                parsed = json.loads(raw)
                atype = parsed.get("@type", "")
                if "BoardGame" in atype and parsed.get("image"):
                    return parsed["image"]
        except Exception:
            pass

        # og:image
        try:
            og = page.query_selector("meta[property='og:image']")
            if og:
                val = og.get_attribute("content")
                if val:
                    return val
        except Exception:
            pass

        # meta[name='twitter:image']
        try:
            tw = page.query_selector("meta[name='twitter:image']")
            if tw:
                val = tw.get_attribute("content")
                if val:
                    return val
        except Exception:
            pass

        # Первое большое изображение
        try:
            for sel in [
                "picture source[type='image/webp']",
                "img[class*='game-image']",
                "img[class*='game-header']",
                "img[alt*='box']",
                "img[alt*='cover']",
            ]:
                el = page.query_selector(sel)
                if el:
                    src = (el.get_attribute("src") or
                           el.get_attribute("srcset") or "")
                    if src:
                        return src.split(",")[0].split(" ")[0].strip()
        except Exception:
            pass

        return None

    def _get_cookies_from_context(self, page) -> dict:
        """Извлечение cookies из Playwright контекста для requests."""
        cookies = {}
        try:
            pw_cookies = page.context.cookies()
            for c in pw_cookies:
                cookies[c["name"]] = c["value"]
        except Exception:
            pass
        return cookies

    def _download_image_via_browser(self, page, url: str, slug: str) -> bool:
        """
        Скачивание изображения через context.request (API Playwright).
        Использует ту же сессию что и браузер — Cloudflare пропускает.
        """
        img_dir = Path("media") / "games" / slug
        img_path = img_dir / "cover.jpg"
        abs_path = os.path.join(os.getcwd(), str(img_path))

        if img_path.exists():
            return True

        os.makedirs(img_dir, exist_ok=True)

        try:
            # Используем API-клиент из контекста — он разделяет сессию со страницей
            resp = page.context.request.get(url, timeout=30000)

            if resp.status == 200:
                body = resp.body()
                if len(body) > 1000:
                    with open(abs_path, "wb") as f:
                        f.write(body)
                    return True
                else:
                    self.stdout.write(f"\n    [WARN] тело < 1KB ({len(body)} байт)")
            else:
                self.stdout.write(f"\n    [WARN] API статус {resp.status}")
        except Exception as e:
            self.stdout.write(f"\n    [WARN] context.request: {e}")

        return False

    def _get_page_metadata(self, page) -> tuple[list[str], list[str], list[str]]:
        """Извлечение категорий, механик, дизайнеров со страницы."""
        cats = set()
        for sel in ["a[href*='/boardgamecategory/']"]:
            try:
                for el in page.query_selector_all(sel):
                    t = el.inner_text().strip()
                    if t and len(t) < 100:
                        cats.add(t)
            except Exception:
                pass

        mechs = set()
        for sel in ["a[href*='/boardgamemechanic/']"]:
            try:
                for el in page.query_selector_all(sel):
                    t = el.inner_text().strip()
                    if t and len(t) < 100:
                        mechs.add(t)
            except Exception:
                pass

        des = set()
        for sel in ["a[href*='/boardgamedesigner/']"]:
            try:
                for el in page.query_selector_all(sel):
                    t = el.inner_text().strip()
                    if t and len(t) < 200:
                        des.add(t)
            except Exception:
                pass

        return list(cats), list(mechs), list(des)