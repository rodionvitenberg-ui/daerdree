"""
Management command: Парсинг английских описаний с BGG и сохранение в description_en.

Использует nodriver — патчит Chrome на этапе запуска, обходит Cloudflare.
Единственный источник BGG ID — поиск на сайте (словарь GAMES_MAP не используется).

Использование:
    python manage.py scrape_bgg_descriptions --all                # все игры
    python manage.py scrape_bgg_descriptions --slug camel-up       # одна игра
    python manage.py scrape_bgg_descriptions --all --force         # перезаписать существующие
    python manage.py scrape_bgg_descriptions --all --limit 5       # первые 5 игр
    python manage.py scrape_bgg_descriptions --all --headless      # скрытый браузер
    python manage.py scrape_bgg_descriptions --reset-session       # сбросить Cloudflare-профиль
"""

import asyncio
import json
import os
import re
import time
from pathlib import Path

from django.core.management.base import BaseCommand

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

from boardgames.models import BoardGame

import nodriver as uc


# ─── Вспомогательная: нормализация диакритики (ä→a, é→e) ───

def _normalize(s: str) -> str:
    """Убирает диакритику: 'bärenpark' → 'barenpark'."""
    import unicodedata
    return ''.join(
        c for c in unicodedata.normalize('NFKD', s)
        if not unicodedata.combining(c)
    )


class Command(BaseCommand):
    help = "Парсинг английских описаний с BGG (nodriver)"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Кэш найденных ID — чтобы повторно не искать те же игры
        self._found_ids: dict[str, int] = {}

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
                "  python manage.py scrape_bgg_descriptions --slug camel-up\n"
                "  python manage.py scrape_bgg_descriptions --all"
            ))
            return

        total = games.count()
        if limit:
            games = games[:limit]
            total = len(games)

        self.stdout.write("=" * 60)
        self.stdout.write(f"  Парсер описаний BGG (nodriver)")
        self.stdout.write(f"  Игр: {total} | Force: {force} | Headless: {headless}")
        self.stdout.write("=" * 60)

        total_ok = 0
        total_skip = 0
        total_errors = 0

        browser = await uc.start(
            headless=headless,
            browser_executable_path="/usr/bin/google-chrome",
        )
        page = await browser.get("about:blank")

        await self._cloudflare_warmup(page)

        for idx, game in enumerate(games, start=1):
            # ── Определяем название для поиска: английское (если есть), иначе русское ──
            search_title = (game.title_en or game.title).strip()

            # Пропуск, если уже есть описание
            if game.description_en and not force:
                self.stdout.write(f"\n[{idx}/{total}] {game.title} — ⏩ description_en уже есть (пропуск)")
                total_skip += 1
                continue

            # Собираем кандидатов: поиск на BGG — единственный источник ID
            candidates: list[tuple[int, str]] = []
            cached_id = self._found_ids.get(search_title.lower())
            if cached_id:
                candidates.append((cached_id, search_title.lower()))
            search_candidates = await self._search_bgg_id_candidates(page, search_title)
            seen_ids = {cid for cid, _ in candidates}
            for cid, link_text in search_candidates:
                if cid not in seen_ids:
                    candidates.append((cid, link_text))
                    seen_ids.add(cid)

            if not candidates:
                self.stdout.write(
                    f"\n[{idx}/{total}] {game.title} — ⚠ BGG ID не найден, пропуск"
                )
                total_skip += 1
                continue

            self.stdout.write(
                f"\n[{idx}/{total}] {game.title} — кандидатов: {len(candidates)}"
            )
            self.stdout.flush()

            found = False
            for cand_idx, (bgg_id, link_text) in enumerate(candidates):
                try:
                    url = f"https://boardgamegeek.com/boardgame/{bgg_id}/"
                    await page.get(url)
                    await page.sleep(10)

                    # ── Верификация: link_text / title_en против <title> ──
                    page_title = await self._get_page_title(page)
                    if page_title:
                        pt_normalized = _normalize(page_title.lower())
                        lt_normalized = _normalize(link_text.lower())

                        if self._titles_match(lt_normalized, pt_normalized):
                            pass  # ок — link_text совпадает
                        elif game.title_en and self._titles_match(
                            _normalize(game.title_en.lower()), pt_normalized
                        ):
                            pass  # ок — title_en совпадает
                        else:
                            self.stdout.write(
                                f"  ⚠ BGG#{bgg_id} → «{page_title}» "
                                f"(не совпадает ни с «{link_text}»"
                                + (f", ни с «{game.title_en}»)" if game.title_en else ")")
                                + f", пробую дальше..."
                            )
                            await page.sleep(1)
                            continue

                    # Извлекаем описание
                    desc_en = await self._extract_description(page)

                    if desc_en:
                        game.description_en = desc_en
                        game.save()
                        self._found_ids[search_title.lower()] = bgg_id
                        self.stdout.write(
                            f"  ✅ BGG#{bgg_id} → Сохранено ({len(desc_en)} симв.)"
                        )
                        total_ok += 1
                        found = True
                        break
                    else:
                        self.stdout.write(f"  ⚠ BGG#{bgg_id} — описание не найдено на странице")
                        await page.sleep(1)
                        continue

                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  ⚠ BGG#{bgg_id} — ошибка: {e}"))
                    await page.sleep(1)
                    continue

            if not found:
                self.stdout.write(f"  ❌ Ни один кандидат не подошёл")
                total_errors += 1

            await page.sleep(2)

        browser.stop()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("  ИТОГИ:")
        self.stdout.write(f"    Сохранено описаний: {total_ok}")
        self.stdout.write(f"    Пропущено:          {total_skip}")
        self.stdout.write(f"    Ошибок:             {total_errors}")
        self.stdout.write("=" * 60)

    # ═══════════════════════════════════════════════════════════

    async def _search_bgg_id_candidates(self, page, title: str) -> list[tuple[int, str]]:
        """
        Поиск BGG ID по названию через поисковую строку BGG.
        Возвращает список (bgg_id, link_text), отсортированных по релевантности
        (точные совпадения в начале).
        """
        from urllib.parse import quote_plus
        from difflib import SequenceMatcher

        search_url = f"https://boardgamegeek.com/search/boardgame?q={quote_plus(title)}"
        title_lower = title.lower()
        title_words = set(title_lower.split())

        try:
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

            # Ищем все ссылки boardgame/ID с текстом внутри
            matches = list(re.finditer(
                r'href="/boardgame(?:expansion)?/(\d+)/[^"]*"[^>]*>([^<]+)<',
                search_html,
            ))

            exact: list[tuple[int, str]] = []
            fuzzy: list[tuple[float, int, str]] = []
            word_match: list[tuple[int, str]] = []

            seen: set[int] = set()

            for m in matches:
                link_text = m.group(2).strip().lower()
                bgg_id = int(m.group(1))
                if bgg_id in seen:
                    continue
                seen.add(bgg_id)

                # Точное совпадение
                if title_lower in link_text or link_text in title_lower:
                    exact.append((bgg_id, link_text))
                    continue

                # Нечёткое совпадение (SequenceMatcher)
                score = SequenceMatcher(None, title_lower, link_text).ratio()
                if score > 0.6:
                    fuzzy.append((score, bgg_id, link_text))
                    continue

                # Совпадение по словам (≥2 общих слов)
                link_words = set(link_text.split())
                if len(title_words & link_words) >= 2:
                    word_match.append((bgg_id, link_text))

            # Сортируем нечёткие по убыванию score
            fuzzy.sort(key=lambda x: x[0], reverse=True)
            fuzzy_ids = [(bgg_id, link_text) for _, bgg_id, link_text in fuzzy]

            return exact + fuzzy_ids + word_match
        except Exception:
            return []

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

    @staticmethod
    def _titles_match(candidate: str, page_title: str) -> bool:
        """
        Проверяет, совпадает ли candidate с page_title.
        Уровни проверки (по возрастанию строгости):
          1. candidate целиком содержится в page_title
          2. page_title начинается с candidate (обрезая «...» на конце)
          3. Первые N слов candidate совпадают с первыми N словами page_title
             (для случаев «Welcome to Your Perfect Home» vs «Welcome To...»)
        """
        # Уровень 1: полное вхождение
        if candidate in page_title:
            return True

        # Уровень 2: candidate без многоточия в начале page_title
        candidate_clean = candidate.rstrip('.…')
        if page_title.startswith(candidate_clean):
            return True

        # Уровень 3: совпадение первых 2+ слов
        candidate_words = candidate_clean.split()
        page_words = page_title.split()
        if len(candidate_words) >= 2:
            # Сколько слов из candidate совпадают с началом page_title?
            match_count = 0
            for cw, pw in zip(candidate_words, page_words):
                if cw == pw:
                    match_count += 1
                else:
                    break
            # Если ≥2 слов совпало и это ≥ половины слов candidate — считаем совпадением
            if match_count >= 2 and match_count >= len(candidate_words) * 0.5:
                return True

        return False

    async def _get_page_title(self, page) -> str | None:
        """
        Извлекает заголовок страницы (<title>).
        Используется для верификации, та ли игра загружена.
        """
        html = await page.get_content()
        m = re.search(r'<title>([^<]+)</title>', html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
        m = re.search(r'<h1[^>]*>([^<]+)</h1>', html, re.IGNORECASE)
        if m:
            return m.group(1).strip()
        return None

    async def _extract_description(self, page) -> str | None:
        """
        Извлекает описание со страницы BGG.
        Приоритет:
          1. Angular-блок с полным описанием (ng-bind-html="geekitemctrl.wikitext")
          2. JSON-LD (schema.org/BoardGame)
          3. og:description (мета-тег, короткий)
        """
        html = await page.get_content()

        # 1. Основной источник: Angular-блок с wikitext (полное описание)
        m = re.search(
            r'<div\s[^>]*ng-bind-html="[^"]*wikitext[^"]*"[^>]*>(?P<desc>.*?)</div>',
            html,
            re.DOTALL | re.IGNORECASE,
        )
        if m:
            raw = m.group("desc").strip()
            if raw and len(raw) > 50:
                return raw.strip()

        # 2. Fallback: game-description-body (старый формат)
        m = re.search(
            r'<(?P<tag>article|div)\s[^>]*class="[^"]*game-description-body[^"]*"[^>]*>(?P<body>.*?)</(?P=tag)>',
            html,
            re.DOTALL | re.IGNORECASE,
        )
        if m:
            raw = m.group("body").strip()
            if raw and len(raw) > 50:
                return raw.strip()

        # 3. JSON-LD
        for match in re.finditer(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            html,
            re.DOTALL | re.IGNORECASE,
        ):
            try:
                data = json.loads(match.group(1))
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict) and "BoardGame" in item.get("@type", ""):
                        desc = item.get("description", "")
                        if desc and len(desc) > 50:
                            return desc.strip()
            except Exception:
                pass

        # 4. Последний fallback: og:description
        m = re.search(
            r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)["\']',
            html,
            re.IGNORECASE,
        )
        if m:
            content = m.group(1)
            if content and len(content) > 50:
                return content.strip()

        return None