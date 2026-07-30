"""
Management command: Переводит описания настольных игр с английского на русский
через DeepSeek API + проверяет качество существующих переводов.

Режимы:
  --all              все игры
  --slug <slug>      конкретная игра
  --limit N          ограничение по количеству
  --force            перезаписать существующие description_ru
  --validate         проверить качество ВСЕХ существующих переводов
  --dry-run          только показать, что будет сделано (без вызова API)

Использование:
  export DEEPSEEK_API_KEY="sk-..."   # или через --api-key
  python manage.py translate_descriptions --all
  python manage.py translate_descriptions --slug camel-up
  python manage.py translate_descriptions --all --force
  python manage.py translate_descriptions --all --validate
  python manage.py translate_descriptions --all --dry-run
  python manage.py translate_descriptions --all --limit 5
"""

import json
import os
import re
import time
import sys
from pathlib import Path

from django.core.management.base import BaseCommand
import requests


# ─── Путь к full_dump.json (относительно BASE_DIR) ───
DUMP_PATH = Path(__file__).resolve().parent.parent.parent.parent / "full_dump.json"

# ─── DeepSeek API ───
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

# ─── Лимиты ───
MAX_RETRIES = 3
RETRY_DELAY = 5  # сек между повторами
RATE_LIMIT_DELAY = 1.5  # сек между запросами (чтобы не забанили)

# ─── Prompt для переводчика ───
SYSTEM_PROMPT = """Ты — профессиональный переводчик контента для сайта клуба настольных игр «Daedree». 
Твоя задача — переводить описания настольных игр с английского на русский и проверять качество существующих переводов.

## Правила перевода (description_en → description_ru):
1. Сохраняй ВСЕ HTML-теги нетронутыми: <p>, <strong>, <em>, <ul>, <li>, <a href="...">, <br>, <ol>, и т.д. Переводи ТОЛЬКО текст внутри них.
2. Названия игр, механик и торговых марок НЕ переводи: "Camel Up" остаётся "Camel Up", "Ticket to Ride" остаётся "Ticket to Ride".
3. Сохраняй ссылки (href) как есть — не меняй URL.
4. Используй устоявшуюся русскую терминологию настольных игр:
   - victory points → победные очки (VP)
   - worker placement → размещение работников
   - tile → плитка / жетон
   - card → карта
   - board → поле / доска
   - turn → ход
   - round → раунд
   - ability → способность
   - effect → эффект
   - deck → колода
   - token → жетон / маркер
   - meeple → мипл / фишка
   - dice → кубики / дайсы
5. Стиль — литературный, живой русский язык. Описания с BGG написаны маркетингово-увлекательно — сохрани этот тон.
6. НЕ добавляй информации, которой нет в оригинале. НЕ убирай информацию.
7. Если в description_en есть русский текст (например, пометка "Russian description" или русский абзац) — сохрани его как есть.
8. ВАЖНО: Если description_en содержит только ссылку на другое описание или сообщение об ошибке — оставь как есть, не переводи.

## Формат ответа:
Верни ТОЛЬКО переведённый HTML-текст для description_ru. Никаких пояснений, комментариев или лишнего текста.

## Если пришёл validate-запрос (description_ru уже существует):
Оцени качество существующего перевода по шкале GOOD / ACCEPTABLE / POOR:
- GOOD — грамматически верно, терминология корректна, стиль хороший, ничего не потеряно
- ACCEPTABLE — мелкие недочёты, но в целом понятно и приемлемо
- POOR — ошибки, потеря смысла, корявый язык, отсебятина

Верни JSON: {"quality": "GOOD|ACCEPTABLE|POOR", "comment": "краткое пояснение"}

## Если пришёл validate-title-запрос (проверка английского названия):
Оцени, соответствует ли title_en реальному английскому названию игры.
Верни JSON: {"correct": true/false, "suggested": "предложенное название (если incorrect)"}"""


def _clean_html_for_display(text: str) -> str:
    """Убирает HTML-теги для краткого показа в консоли."""
    return re.sub(r'<[^>]+>', '', text).strip()[:120]


def _has_cyrillic(text: str) -> bool:
    """Проверяет, содержит ли строка кириллицу."""
    return bool(re.search(r'[\u0400-\u04FF]', text))


def _is_valid_html(html_text: str) -> bool:
    """Грубая проверка, что HTML-структура не сломана."""
    # Проверяем парные теги (не идеально, но ловит основные проблемы)
    open_tags = set(re.findall(r'<(?!/)([a-zA-Z0-9]+)[^>]*>', html_text))
    close_tags = set(re.findall(r'</([a-zA-Z0-9]+)>', html_text))
    unmatched = open_tags - close_tags
    # Допускаем <br>, <hr>, <img> — самозакрывающиеся
    unmatched.discard('br')
    unmatched.discard('hr')
    unmatched.discard('img')
    unmatched.discard('input')
    return len(unmatched) == 0


class Command(BaseCommand):
    help = "Перевод описаний настольных игр через DeepSeek API"

    def add_arguments(self, parser):
        parser.add_argument("--slug", type=str, default=None)
        parser.add_argument("--all", action="store_true", default=False)
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--force", action="store_true", default=False)
        parser.add_argument("--validate", action="store_true", default=False)
        parser.add_argument("--dry-run", action="store_true", default=False)
        parser.add_argument("--api-key", type=str, default=None)

    def handle(self, *args, **kwargs):
        slug = kwargs["slug"]
        process_all = kwargs["all"]
        limit = kwargs["limit"]
        force = kwargs["force"]
        validate = kwargs["validate"]
        dry_run = kwargs["dry_run"]
        api_key = kwargs["api_key"] or os.environ.get("DEEPSEEK_API_KEY")

        if not api_key:
            self.stderr.write(self.style.ERROR(
                "❌ Не задан DEEPSEEK_API_KEY.\n"
                "   Укажите --api-key <key> или установите переменную окружения DEEPSEEK_API_KEY."
            ))
            sys.exit(1)

        # ── Загрузка дампа ──
        if not DUMP_PATH.exists():
            self.stderr.write(self.style.ERROR(f"❌ Файл {DUMP_PATH} не найден."))
            sys.exit(1)

        with open(DUMP_PATH, "r", encoding="utf-8") as f:
            dump = json.load(f)

        games = dump["boardgames"]["games"]
        total = len(games)

        # ── Фильтрация ──
        if slug:
            games_to_process = [g for g in games if g.get("slug") == slug]
            if not games_to_process:
                self.stderr.write(self.style.ERROR(f"❌ Игра со slug '{slug}' не найдена."))
                sys.exit(1)
        elif process_all:
            games_to_process = games
        else:
            self.stderr.write(self.style.WARNING(
                "Укажите --slug <slug> или --all.\n"
                "  python manage.py translate_descriptions --slug camel-up\n"
                "  python manage.py translate_descriptions --all"
            ))
            sys.exit(1)

        if limit:
            games_to_process = games_to_process[:limit]

        self.stdout.write("=" * 70)
        self.stdout.write(f"  Перевод описаний настольных игр через DeepSeek ({DEEPSEEK_MODEL})")
        self.stdout.write(f"  Игр: {len(games_to_process)}")
        if force:
            self.stdout.write("  Режим: FORCE (перезапись всех существующих переводов)")
        if validate:
            self.stdout.write("  Режим: VALIDATE (проверка существующих переводов)")
        if dry_run:
            self.stdout.write("  Режим: DRY-RUN (только анализ, без отправки)")
        self.stdout.write("=" * 70)

        total_ok = 0
        total_skip = 0
        total_errors = 0
        total_validate_ok = 0
        total_validate_issues = 0

        for idx, game in enumerate(games_to_process, start=1):
            game_title = game.get("title", "?")
            slug_str = game.get("slug", "")
            desc_en = game.get("description_en", "") or ""
            desc_ru = game.get("description_ru", "") or ""
            short_desc = game.get("description", "") or ""
            title_ru = game.get("title_ru", "") or ""
            title_en = game.get("title_en", "") or ""

            self.stdout.write(f"\n[{idx}/{len(games_to_process)}] {game_title} ({slug_str})")
            self.stdout.flush()

            # ── VALIDATE MODE ──
            if validate:
                # Проверить description_ru и title_ru, если есть
                issues = []
                has_ru_text = desc_ru and _has_cyrillic(desc_ru)
                has_short_ru = short_desc and _has_cyrillic(short_desc)

                if has_ru_text or has_short_ru:
                    text_to_check = desc_ru if has_ru_text else short_desc
                    prompt_type = "validate"
                    result = self._call_deepseek_validate(
                        api_key, game_title, title_en, text_to_check, prompt_type
                    )
                    if result:
                        quality = result.get("quality", "POOR")
                        comment = result.get("comment", "")
                        if quality == "GOOD":
                            total_validate_ok += 1
                            self.stdout.write(f"  ✅ Перевод: {quality} — {comment}")
                        elif quality == "ACCEPTABLE":
                            total_validate_ok += 1
                            self.stdout.write(f"  ⚠️  Перевод: {quality} — {comment}")
                            issues.append(f"translation_{quality}_{comment}")
                        else:
                            total_validate_issues += 1
                            self.stdout.write(f"  ❌ Перевод: {quality} — {comment}")
                            issues.append(f"translation_{quality}_{comment}")
                    else:
                        self.stdout.write("  ⚠️  Не удалось проверить перевод (ошибка API)")
                else:
                    self.stdout.write(f"  ⏩ Нет русского описания для проверки")

                # Проверить title_en
                if title_en and not _has_cyrillic(title_en):
                    result = self._call_deepseek_validate_title(
                        api_key, game_title, title_en
                    )
                    if result:
                        if result.get("correct", False):
                            self.stdout.write(f"  ✅ title_en корректен: «{title_en}»")
                            total_validate_ok += 1
                        else:
                            suggested = result.get("suggested", "")
                            self.stdout.write(
                                f"  ❌ title_en НЕ корректен: «{title_en}» → предлагается «{suggested}»"
                            )
                            total_validate_issues += 1
                            issues.append(f"title_en_{suggested}")
                else:
                    self.stdout.write(f"  ⏩ Нет title_en для проверки")

                if issues:
                    self.stdout.write(self.style.WARNING(f"  ⚠ Найдено {len(issues)} проблем"))
                continue

            # ── TRANSLATE MODE ──

            # Определяем, нужно ли переводить
            skip = False

            # Если description_ru уже есть (и содержит кириллицу) — проверяем
            if desc_ru and _has_cyrillic(desc_ru) and not force:
                self.stdout.write(f"  ⏩ description_ru уже есть (пропуск, используйте --force для перезаписи)")
                total_skip += 1
                continue

            # Если description_ru есть через short_desc (поле description из дампа)
            if short_desc and _has_cyrillic(short_desc) and not desc_ru and not force:
                # Переносим short_desc в description_ru
                if not dry_run:
                    game["description_ru"] = short_desc
                    self.stdout.write(f"  🔄 Перенесено description → description_ru ({len(short_desc)} симв.)")
                else:
                    self.stdout.write(f"  🔄 [DRY-RUN] Будет перенесено description → description_ru")
                total_ok += 1
                continue

            # Если нет исходного текста для перевода
            if not desc_en:
                self.stdout.write(f"  ⏩ description_en пустое — нечего переводить")
                total_skip += 1
                continue

            # Если description_en короткое или выглядит как мусор
            if len(desc_en.strip()) < 20:
                self.stdout.write(f"  ⏩ description_en слишком короткое ({len(desc_en)} симв.)")
                total_skip += 1
                continue

            # ── Вызов DeepSeek API ──
            if dry_run:
                self.stdout.write(f"  🔄 [DRY-RUN] Будет переведено ({len(desc_en)} симв. исходника)")
                total_ok += 1
                continue

            translated = self._call_deepseek_translate(api_key, game_title, title_en, desc_en)

            if translated:
                # Проверяем, что перевод содержит кириллицу (значит, действительно переведено)
                if _has_cyrillic(translated):
                    # Сохраняем
                    game["description_ru"] = translated

                    # Если description пустое — копируем перевод туда тоже
                    if not game.get("description", "").strip():
                        game["description"] = _clean_html_for_display(translated) if len(translated) > 200 else translated

                    # Проверка целостности HTML
                    if not _is_valid_html(translated):
                        self.stdout.write(self.style.WARNING(f"  ⚠ Предупреждение: возможно, нарушена HTML-структура"))

                    self.stdout.write(f"  ✅ Сохранено ({len(translated)} симв.)")
                    total_ok += 1
                else:
                    self.stdout.write(self.style.WARNING(
                        f"  ⚠ Ответ не содержит кириллицы — возможно, не переведено. Пропуск."
                    ))
                    total_errors += 1
            else:
                self.stdout.write(self.style.ERROR(f"  ❌ Ошибка перевода"))
                total_errors += 1

            # Задержка между запросами (rate limiting)
            time.sleep(RATE_LIMIT_DELAY)

        # ── Сохранение дампа ──
        if not dry_run and not validate:
            with open(DUMP_PATH, "w", encoding="utf-8") as f:
                json.dump(dump, f, ensure_ascii=False, indent=2)
            self.stdout.write(self.style.SUCCESS(f"\n✅ Дамп сохранён: {DUMP_PATH}"))

        # ── Итоги ──
        self.stdout.write("\n" + "=" * 70)
        if validate:
            self.stdout.write(f"  ИТОГИ ВАЛИДАЦИИ:")
            self.stdout.write(f"    OK / GOOD:      {total_validate_ok}")
            self.stdout.write(f"    C проблемами:   {total_validate_issues}")
        else:
            self.stdout.write(f"  ИТОГИ ПЕРЕВОДА:")
            self.stdout.write(f"    Переведено:     {total_ok}")
            self.stdout.write(f"    Пропущено:      {total_skip}")
            self.stdout.write(f"    Ошибок:         {total_errors}")
        self.stdout.write("=" * 70)

    # ═══════════════════════════════════════════════════════════════════

    def _call_deepseek_translate(
        self, api_key: str, title: str, title_en: str, text_en: str
    ) -> str | None:
        """
        Отправляет английский текст на перевод в DeepSeek.
        Возвращает переведённый текст или None при ошибке.
        """
        # Обрезаем, если слишком длинный (DeepSeek имеет лимиты)
        # ~4000 символов — безопасно для большинства описаний игр
        if len(text_en) > 15000:
            text_en = text_en[:15000] + "\n\n[...текст обрезан из-за длины...]"

        payload = {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Переведи описание настольной игры на русский язык.\n\n"
                        f"Название игры (оригинал): {title_en or title}\n"
                        f"Название игры (русское): {title}\n\n"
                        f"Текст для перевода (description_en):\n"
                        f"{text_en}"
                    ),
                },
            ],
            "temperature": 0.3,
            "max_tokens": 8192,
        }

        return self._call_deepseek(api_key, payload)

    def _call_deepseek_validate(
        self, api_key: str, title: str, title_en: str, current_ru: str, mode: str
    ) -> dict | None:
        """Проверяет качество существующего русского перевода."""
        payload = {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Проверь качество существующего русского перевода описания настольной игры.\n\n"
                        f"Название игры (оригинал): {title_en or title}\n"
                        f"Название игры (русское): {title}\n\n"
                        f"Текущий русский перевод (description_ru):\n"
                        f"{current_ru[:3000]}\n\n"
                        f"Ответь JSON: {{\"quality\": \"GOOD|ACCEPTABLE|POOR\", "
                        f"\"comment\": \"краткое пояснение на русском\"}}"
                    ),
                },
            ],
            "temperature": 0.3,
            "max_tokens": 1024,
        }

        response_text = self._call_deepseek(api_key, payload, is_validate=True)
        if response_text:
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                return None
        return None

    def _call_deepseek_validate_title(
        self, api_key: str, title: str, title_en: str
    ) -> dict | None:
        """Проверяет корректность английского названия игры."""
        payload = {
            "model": DEEPSEEK_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": (
                        f"Проверь, соответствует ли английское название игры её реальному английскому названию.\n\n"
                        f"Текущее название (title): «{title}»\n"
                        f"Текущее английское название (title_en): «{title_en}»\n\n"
                        f"Ответь JSON: {{\"correct\": true/false, "
                        f"\"suggested\": \"правильное английское название (если не соответствует)\"}}"
                    ),
                },
            ],
            "temperature": 0.3,
            "max_tokens": 1024,
        }

        response_text = self._call_deepseek(api_key, payload, is_validate=True)
        if response_text:
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                return None
        return None

    def _call_deepseek(
        self, api_key: str, payload: dict, is_validate: bool = False
    ) -> str | None:
        """
        Базовый вызов DeepSeek API с повторными попытками.
        Возвращает текст ответа (content) или None при ошибке.
        """
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        last_error = None
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = requests.post(
                    DEEPSEEK_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=120,
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                    return content

                elif response.status_code == 429:
                    # Rate limited
                    retry_after = int(response.headers.get("Retry-After", RETRY_DELAY))
                    self.stdout.write(
                        f"  ⏳ Rate limited, пауза {retry_after}с (попытка {attempt}/{MAX_RETRIES})..."
                    )
                    time.sleep(retry_after)
                    last_error = f"HTTP 429: {response.text[:200]}"
                    continue

                elif response.status_code == 400:
                    # Bad request — не повторяем
                    self.stderr.write(
                        self.style.ERROR(f"  ❌ Bad Request (400): {response.text[:300]}")
                    )
                    return None

                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  ⚠ HTTP {response.status_code} (попытка {attempt}/{MAX_RETRIES})"
                        )
                    )
                    last_error = f"HTTP {response.status_code}: {response.text[:200]}"
                    time.sleep(RETRY_DELAY)
                    continue

            except requests.exceptions.Timeout:
                self.stdout.write(
                    self.style.WARNING(f"  ⏰ Timeout (попытка {attempt}/{MAX_RETRIES})")
                )
                last_error = "Timeout"
                time.sleep(RETRY_DELAY)
                continue

            except requests.exceptions.ConnectionError as e:
                self.stdout.write(
                    self.style.WARNING(f"  🔌 Connection error (попытка {attempt}/{MAX_RETRIES}): {e}")
                )
                last_error = str(e)
                time.sleep(RETRY_DELAY)
                continue

            except Exception as e:
                last_error = str(e)
                if attempt < MAX_RETRIES:
                    self.stdout.write(
                        self.style.WARNING(f"  ⚠ Ошибка (попытка {attempt}/{MAX_RETRIES}): {e}")
                    )
                    time.sleep(RETRY_DELAY)
                    continue
                break

        if last_error:
            self.stderr.write(self.style.ERROR(f"  ❌ DeepSeek API ошибка: {last_error}"))

        return None