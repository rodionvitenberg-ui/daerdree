"""Отладка: что за ссылки на странице поиска BGG."""
import os, time
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
from playwright.sync_api import sync_playwright

p = sync_playwright().start()
b = p.chromium.launch(headless=False, channel="chrome")
page = b.new_page()

page.goto("https://boardgamegeek.com/search/boardgame?q=7+Wonders", timeout=60000)
print("Загружено, жду 10 сек...")
time.sleep(10)

# Все ссылки
links = page.query_selector_all("a")
print(f"\nВсего ссылок: {len(links)}")
for link in links[:30]:
    href = link.get_attribute("href") or ""
    text = (link.inner_text() or "").strip()[:60]
    if '/boardgame/' in href or '/boardgameexpansion/' in href:
        print(f"  BGG: {href} | {text}")

# Все элементы с data-evt = "search result"
results = page.query_selector_all("[data-evt*='result'], [data-evt*='search'], .result, .search-result")
print(f"\nРезультатов поиска: {len(results)}")
count = 0
for r in results:
    html = (r.inner_html() or "")[:200]
    print(f"  {html}")

input("\nНажми Enter...")
b.close()
p.stop()