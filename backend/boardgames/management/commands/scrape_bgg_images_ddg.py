"""Скачивание изображений игр через DuckDuckGo Images (рабочая версия)."""
import os, time, json, re, urllib.parse
from pathlib import Path
from urllib.parse import quote_plus
from django.core.management.base import BaseCommand
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
from boardgames.models import BoardGame
from playwright.sync_api import sync_playwright

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"

def extract_original(src):
    """
    DDG прокси: //external-content.duckduckgo.com/iu/?u=https%3A%2F%2Foriginal...
    Извлекаем u= параметр.
    """
    if 'external-content.duckduckgo.com/iu/' in src:
        parsed = urllib.parse.urlparse(src)
        qs = urllib.parse.parse_qs(parsed.query)
        if 'u' in qs:
            return qs['u'][0]
    return src

class Command(BaseCommand):
    help = "Скачивание изображений игр через DuckDuckGo Images"

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=None)
        parser.add_argument('--headless', action='store_true', default=False)
        parser.add_argument('--force', action='store_true', default=False)

    def handle(self, *args, **kwargs):
        games = BoardGame.objects.all()
        if not kwargs['force']:
            games = [g for g in games if not g.image]
        if kwargs['limit']:
            games = games[:kwargs['limit']]
        if not games:
            self.stdout.write(self.style.WARNING('Нет игр'))
            return

        p = sync_playwright().start()
        b = p.chromium.launch(headless=kwargs['headless'],
            args=['--no-sandbox','--disable-blink-features=AutomationControlled'])
        ctx = b.new_context(user_agent=UA, viewport={'width':1920,'height':1080})
        page = ctx.new_page()

        ok_total = 0
        for idx, game in enumerate(games, 1):
            self.stdout.write(f"\n[{idx}/{len(games)}] {game.title}")
            q = quote_plus(f'{game.title} board game')
            try:
                page.goto(f'https://duckduckgo.com/?q={q}&iax=images&ia=images',
                          wait_until='domcontentloaded', timeout=60000)
                time.sleep(3)
                for _ in range(3):
                    page.evaluate('window.scrollBy(0,600)')
                    time.sleep(0.5)
                time.sleep(2)

                # Берём все img src
                urls = page.evaluate("""
                    () => {
                        const srcs = [];
                        document.querySelectorAll('img[src*="external-content"]').forEach(i => {
                            let s = i.getAttribute('src');
                            if (s) {
                                if (s.startsWith('//')) s = 'https:' + s;
                                srcs.push(s);
                            }
                        });
                        return srcs;
                    }
                """) or []

                # Извлекаем оригиналы из DDG прокси
                originals = [extract_original(u) for u in urls]
                originals = list(dict.fromkeys(o for o in originals if o))

                self.stdout.write(f"  URL: {len(originals)}")
                for u in originals[:3]:
                    self.stdout.write(f"    {u[:100]}")

                saved = 0
                for i, url in enumerate(originals[:5]):
                    name = 'cover.jpg' if i == 0 else f'cover_{i}.jpg'
                    path = Path('media') / 'games' / game.slug / name
                    path.parent.mkdir(parents=True, exist_ok=True)
                    try:
                        import requests
                        r = requests.get(url, headers={'User-Agent': UA}, timeout=15)
                        if r.status_code == 200 and len(r.content) > 2000:
                            path.write_bytes(r.content)
                            saved += 1
                            self.stdout.write(f'    ✅ {name}')
                    except:
                        continue

                ok_total += saved
                self.stdout.write(f'  скачано: {saved}')
            except Exception as e:
                self.stdout.write(f'  ⚠ {e}')
            time.sleep(1.5)

        b.close()
        p.stop()
        self.stdout.write(f'\n✅ Скачано: {ok_total}')