"""
Management command: Заполняет title_en реальными английскими названиями с BGG.

Для каждой игры:
  - Ищет на BGG по текущему title (русскому или английскому)
  - Если не находит — пробует поиск по первому слову названия
  - Если не находит — пробует поиск по первой части slug'а (латиница)
  - Открывает страницу игры, извлекает чистый английский заголовок из <title>
  - Сохраняет: title_ru = game.title, title_en = <английский заголовок>

Автоматически перезаписывает title_en, если там кириллица (русский текст).

Использование:
    python manage.py fill_english_titles --all              # все игры
    python manage.py fill_english_titles --slug camel-up     # одна игра
    python manage.py fill_english_titles --all --force       # перезаписать все (даже латиницу)
    python manage.py fill_english_titles --all --headless    # скрытый браузер
    python manage.py fill_english_titles --reset-session     # сбросить Cloudflare-профиль
"""

import asyncio
import os
import re
from pathlib import Path
from urllib.parse import quote_plus

from django.core.management.base import BaseCommand

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

from boardgames.models import BoardGame

import nodriver as uc


def _clean_title(raw_title: str) -> str:
    """
    Вырезает из <title> страницы BGG чистый заголовок игры.
    '3000 Scoundrels | Board Game | BoardGameGeek' → '3000 Scoundrels'
    '7 Wonders | Board Game | BoardGameGeek' → '7 Wonders'
    """
    if ' | ' in raw_title:
        return raw_title.split(' | ')[0].strip()
    return raw_title.strip()


def _is_cyrillic(s: str) -> bool:
    """Проверяет, содержит ли строка кириллические символы."""
    if not s:
        return False
    return any('\u0400' <= c <= '\u04FF' for c in s)


class Command(BaseCommand):
    help = "Заполняет title_en реальными английскими названиями с BGG"

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
                self.stdout.write(self.style.ERROR(
                    f"Игра со slug '{target_slug}' не найдена."
                ))
                return
        elif process_all:
            games = BoardGame.objects.all()
        else:
            self.stdout.write(self.style.WARNING(
                "Укажите --slug <slug> или --all.\n"
                "  python manage.py fill_english_titles --slug camel-up\n"
                "  python manage.py fill_english_titles --all"
            ))
            return

        total = games.count()
        if limit:
            games = games[:limit]
            total = len(games)

        self.stdout.write("=" * 60)
        self.stdout.write("  Заполнение английских названий (BGG)")
        self.stdout.write(f"  Игр: {total} | Force: {force} | Headless: {headless}")
        self.stdout.write("=" * 60)

        total_filled = 0
        total_skipped = 0
        total_errors = 0

        browser = await uc.start(
            headless=headless,
            browser_executable_path="/usr/bin/google-chrome",
        )
        page = await browser.get("about:blank")

        # Cloudflare warmup
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
            browser.stop()
            return
        input("\n>>> Нажмите Enter когда Cloudflare пройден: ")
        self.stdout.write("✅ Начинаю!\n")
        self.stdout.flush()
        await page.sleep(1)

        for idx, game in enumerate(games, start=1):
            # Нужно ли перезаписывать?
            #   - force=True → всегда
            #   - title_en пуст → да
            #   - title_en содержит кириллицу → да (это русский, не английский)
            needs_update = force or not game.title_en or _is_cyrillic(game.title_en or '')

            if not needs_update:
                self.stdout.write(
                    f"\n[{idx}/{total}] {game.title} — ⏩ title_en уже корректный "
                    f"('{game.title_en}'), пропуск"
                )
                total_skipped += 1
                continue

            self.stdout.write(f"\n[{idx}/{total}] {game.title}…")
            self.stdout.flush()

            try:
                english_title = await self._find_english_title(
                    page, game.title, game.slug
                )
            except Exception as e:
                self.stdout.write(self.style.WARNING(
                    f"  ⚠ Ошибка при поиске: {e}"
                ))
                total_errors += 1
                await page.sleep(2)
                continue

            if english_title:
                # Сохраняем оригинальный title как title_ru
                if not game.title_ru or force:
                    game.title_ru = game.title
                # Сохраняем английское название
                game.title_en = english_title
                game.save()
                self.stdout.write(
                    f"  ✅ title_ru='{game.title}', title_en='{game.title_en}'"
                )
                total_filled += 1
            else:
                self.stdout.write(f"  ❌ Английское название не найдено на BGG")
                total_errors += 1

            await page.sleep(2)

        browser.stop()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  ИТОГИ:")
        self.stdout.write(f"    Заполнено названий: {total_filled}")
        self.stdout.write(f"    Пропущено (уже ок): {total_skipped}")
        self.stdout.write(f"    Ошибок:             {total_errors}")
        self.stdout.write("=" * 60)

    async def _find_english_title(
        self, page, title: str, slug: str
    ) -> str | None:
        """
        Находит английское название игры на BGG.

        Стратегии поиска (по очереди):
          1. Полное название как есть (русское или английское)
          2. Первое слово названия (для «Азул: Летний Дворец» → «Азул»)
          3. Slug целиком (латиница, может совпадать с английским названием)
          4. Первая часть slug'а (для «azul-letnii-dvorets» → «azul»)
        """
        # ── Стратегия 1: полное название ──
        result = await self._try_search_and_extract(page, title)
        if result:
            return result

        # ── Стратегия 2: первое слово (до двоеточия или первого пробела) ──
        first_word = title.split(':')[0].strip().split()[0]
        if first_word and first_word != title:
            self.stdout.write(f"  🔄 Пробую поиск по первому слову: «{first_word}»")
            result = await self._try_search_and_extract(page, first_word)
            if result:
                return result

        # ── Стратегия 3: slug целиком ──
        if slug and slug != title.lower():
            self.stdout.write(f"  🔄 Пробую поиск по slug: «{slug}»")
            result = await self._try_search_and_extract(page, slug)
            if result:
                return result

        # ── Стратегия 4: первая часть slug'а (до дефиса) ──
        slug_first = slug.split('-')[0] if slug else ''
        if slug_first and slug_first != slug:
            self.stdout.write(f"  🔄 Пробую поиск по slug-префиксу: «{slug_first}»")
            result = await self._try_search_and_extract(page, slug_first)
            if result:
                return result

        return None

    async def _try_search_and_extract(
        self, page, search_term: str
    ) -> str | None:
        """
        Ищет search_term на BGG, открывает первую найденную игру,
        извлекает английский заголовок из <title>.
        Возвращает None если игра не найдена или заголовок не удалось извлечь.
        """
        search_url = (
            f"https://boardgamegeek.com/search/boardgame?q={quote_plus(search_term)}"
        )

        # Сбрасываем страницу на about:blank перед навигацией,
        # иначе nodriver может не уйти с предыдущей страницы игры
        await page.get("about:blank")
        await page.sleep(1)

        await page.get(search_url)
        await page.sleep(3)

        html = await page.get_content()

        # Вырезаем только таблицу результатов (игнорируем сайдбар "The Hotness")
        table_match = re.search(
            r'<table[^>]*class="[^"]*collection_table[^"]*"[^>]*>(.*?)</table>',
            html,
            re.DOTALL | re.IGNORECASE,
        )
        search_html = table_match.group(1) if table_match else html

        # Ищем первую ссылку на boardgame/ID в результатах поиска
        match = re.search(
            r'href="/boardgame(?:expansion)?/(\d+)/[^"]*"',
            search_html,
            re.IGNORECASE,
        )
        if not match:
            match = re.search(
                r'/boardgame(?:expansion)?/(\d+)/',
                search_html,
                re.IGNORECASE,
            )

        if not match:
            self.stdout.write(f"    ↳ Нет результатов для «{search_term}»")
            return None

        bgg_id = int(match.group(1))
        game_url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"

        await page.get(game_url)
        await page.sleep(8)

        page_html = await page.get_content()

        # Извлекаем <title>
        title_match = re.search(
            r'<title>([^<]+)</title>',
            page_html,
            re.IGNORECASE,
        )
        if title_match:
            raw_title = title_match.group(1).strip()
            self.stdout.write(f"  🔍 BGG title: «{raw_title}»")
            return _clean_title(raw_title)

        # Fallback: h1
        h1_match = re.search(
            r'<h1[^>]*>([^<]+)</h1>',
            page_html,
            re.IGNORECASE,
        )
        if h1_match:
            raw = h1_match.group(1).strip()
            self.stdout.write(f"  🔍 BGG h1: «{raw}»")
            return raw.strip()

        return None