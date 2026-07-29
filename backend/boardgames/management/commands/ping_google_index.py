"""
Management command: Пинг Google Indexing API через OAuth 2.0.

Требуется сервисный аккаунт Google Cloud:
  1. Создать проект в https://console.cloud.google.com
  2. Включить Indexing API
  3. Создать сервисный аккаунт → скачать JSON-ключ
  4. Добавить сервисный аккаунт как владельца в Search Console
  5. Установить PyJWT: pip install pyjwt

Использование:
    python manage.py ping_google_index --credentials /path/to/key.json
    python manage.py ping_google_index --credentials /path/to/key.json --limit 10
    python manage.py ping_google_index --credentials /path/to/key.json --dry-run

Без credentials Google указывает на sitemap в robots.txt, Google сам найдёт.
Проверить статус: https://search.google.com/search-console
"""

import json
import os
import sys
from pathlib import Path

from django.core.management.base import BaseCommand

import requests


INDEXING_API_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish"


class Command(BaseCommand):
    help = "Пинг Google Indexing API через OAuth 2.0"

    def add_arguments(self, parser):
        parser.add_argument(
            "--credentials",
            type=str,
            default=None,
            help="Путь к JSON-ключу сервисного аккаунта Google",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Ограничить количество URL",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Показать URL без отправки",
        )

    def handle(self, *args, **kwargs):
        credentials_path = kwargs["credentials"]
        limit = kwargs["limit"]
        dry_run = kwargs["dry_run"]

        if not credentials_path or not os.path.exists(credentials_path):
            self.stdout.write(self.style.WARNING(
                "Google Indexing API требует сервисный аккаунт."
            ))
            self.stdout.write("Sitemap уже указан в robots.txt — Google сам его найдёт.")
            self.stdout.write("")
            self.stdout.write("Чтобы настроить OAuth 2.0:")
            self.stdout.write("  1. https://console.cloud.google.com → создать проект")
            self.stdout.write("  2. Включить Indexing API")
            self.stdout.write("  3. Создать сервисный аккаунт → скачать JSON")
            self.stdout.write("  4. Добавить аккаунт в Search Console как владельца")
            self.stdout.write("  5. pip install pyjwt")
            self.stdout.write("  6. python manage.py ping_google_index --credentials /path/to/key.json")
            self.stdout.write("")
            self.stdout.write("Проверить индексацию: https://search.google.com/search-console")
            return

        # ── Загружаем credentials ──
        try:
            with open(credentials_path) as f:
                creds = json.load(f)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Ошибка загрузки credentials: {e}"))
            return

        # ── Получаем токен ──
        token = self._get_oauth_token(creds)
        if not token:
            self.stdout.write(self.style.ERROR("Не удалось получить access token через OAuth"))
            return
        self.stdout.write("✅ OAuth 2.0 токен получен")

        # ── Собираем URL из базы ──
        urls = self._build_urls_from_data()
        if limit:
            urls = urls[:limit]

        self.stdout.write(f"📋 URL для отправки: {len(urls)}")
        self.stdout.flush()

        if dry_run:
            for u in urls:
                self.stdout.write(f"  [DRY RUN] {u}")
            self.stdout.write("🏁 Dry run завершён. Запусти без --dry-run для отправки.")
            return

        # ── Отправляем ──
        ok = err = 0
        for idx, url in enumerate(urls, start=1):
            status = self._notify_oauth(token, url)
            if status == 200:
                self.stdout.write(f"  [{idx}/{len(urls)}] ✅ {url}")
                ok += 1
            else:
                self.stdout.write(f"  [{idx}/{len(urls)}] ❌ HTTP {status}: {url[:80]}")
                err += 1

        self.stdout.write(f"\n✅ Отправлено: {ok} | ❌ Ошибок: {err}")
        self.stdout.write("Проверить статус: https://search.google.com/search-console")

    # ──────────────────────────────────────────────

    def _get_oauth_token(self, creds: dict) -> str | None:
        import time
        import jwt as pyjwt

        now = int(time.time())
        payload = {
            "iss": creds["client_email"],
            "scope": "https://www.googleapis.com/auth/indexing",
            "aud": creds["token_uri"],
            "iat": now,
            "exp": now + 3600,
        }
        signed_jwt = pyjwt.encode(payload, creds["private_key"], algorithm="RS256")

        try:
            r = requests.post(
                creds["token_uri"],
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": signed_jwt,
                },
                timeout=15,
            )
            if r.status_code == 200:
                return r.json().get("access_token")
        except Exception:
            pass
        return None

    def _build_urls_from_data(self) -> list[str]:
        from boardgames.models import BoardGame
        from events.models import Event

        base = os.getenv("NEXT_PUBLIC_SITE_URL", "https://daerdree.bar")
        locales = ["en", "ru"]
        urls = []

        static = ["", "/menu", "/games", "/events", "/events/public", "/events/private", "/book", "/faq"]
        for locale in locales:
            for path in static:
                urls.append(f"{base}/{locale}{path}")

        for game in BoardGame.objects.filter(is_active=True)[:500]:
            for locale in locales:
                urls.append(f"{base}/{locale}/games/{game.id}")

        for event in Event.objects.filter(is_visible=True)[:500]:
            for locale in locales:
                urls.append(f"{base}/{locale}/events/{event.id}")

        return urls

    def _notify_oauth(self, token: str, url: str) -> int:
        try:
            r = requests.post(
                INDEXING_API_URL,
                json={"url": url, "type": "URL_UPDATED"},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            return r.status_code
        except Exception:
            return -1
