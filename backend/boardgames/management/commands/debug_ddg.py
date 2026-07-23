"""Отладка: что возвращает DuckDuckGo Images."""
import os, time
os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
from playwright.sync_api import sync_playwright

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"

p = sync_playwright().start()
b = p.chromium.launch(headless=False)
page = b.new_page(user_agent=UA)

page.goto('https://duckduckgo.com/?q=7+Wonders+board+game&iax=images&ia=images', timeout=60000)
print("Страница загружена, жду 10 сек...")
time.sleep(10)

# Скроллим
for _ in range(3):
    page.evaluate('window.scrollBy(0,800)')
    time.sleep(1)

# Сохраняем HTML
html = page.content()
with open('/tmp/ddg_debug.html', 'w') as f:
    f.write(html)
print(f"HTML сохранён: {len(html)} символов")

# Пробуем разные методы извлечения URL
for method_name, js_code in [
    ("img[src]", "() => [...document.querySelectorAll('img[src]')].map(i => i.getAttribute('src')).filter(s => s && s.startsWith('http'))"),
    ("img[data-src]", "() => [...document.querySelectorAll('img[data-src]')].map(i => i.getAttribute('data-src')).filter(s => s && s.startsWith('http'))"),
    ("[data-thumb]", "() => [...document.querySelectorAll('[data-thumb]')].map(i => i.getAttribute('data-thumb')).filter(s => s && s.startsWith('http'))"),
    ("a[href*='external']", "() => [...document.querySelectorAll('a[href*=\"external\"]')].map(a => a.getAttribute('href'))"),
    ("все ссылки с картинками", "() => [...document.querySelectorAll('a[href*=\".jpg\"], a[href*=\".png\"], a[href*=\".webp\"]')].map(a => a.getAttribute('href'))"),
]:
    try:
        urls = page.evaluate(js_code)
        print(f"{method_name}: {len(urls)}")
        for u in urls[:3]:
            print(f"  {u[:120]}")
    except Exception as e:
        print(f"{method_name}: ошибка {e}")

# Сохраняем скриншот
page.screenshot(path='/tmp/ddg_screenshot.png')
print("Скриншот: /tmp/ddg_screenshot.png")

input("\nНажми Enter для выхода...")
b.close()
p.stop()