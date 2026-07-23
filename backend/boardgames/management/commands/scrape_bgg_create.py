"""
Парсер: создание игр в БД по списку русских названий.
Ищет на BGG по английскому названию, верифицирует результат,
парсит категории, механики, описание и создаёт игру.

Использование:
    python manage.py scrape_bgg_create
    python manage.py scrape_bgg_create --limit 3
    python manage.py scrape_bgg_create --no-translate
"""

import json, os, time, re
from pathlib import Path
from urllib.parse import quote_plus
from django.core.management.base import BaseCommand
from django.utils.text import slugify

os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"
from boardgames.models import BoardGame, Category, Tag
from playwright.sync_api import sync_playwright

PROFILE_DIR = Path("chrome_create_profile")

# ─── СЛОВАРЬ русских названий → английские BGG-названия ───
GAMES = [
    ("Концепт", "Concept"),
    ("Криптид", "Cryptid"),
    ("Повелитель Токио", "King of Tokyo"),
    ("Свинтус", "Svintus"),
    ("Мафия", "Mafia"),
    ("Camel Up", "Camel Up"),
    ("Кольт Экспресс", "Colt Express"),
    ("Корова 006", "Korova 006"),
    ("Коднеймс", "Codenames"),
    ("Декодер", "Decoder"),
    ("Секретный Гитлер", "Secret Hitler"),
    ("Авалон", "The Resistance: Avalon"),
    ("Дэни. Голоса в голове", "DANY"),
    ("Бункер", "Bunker"),
    ("Одна ночь с оборотнем", "One Night Ultimate Werewolf"),
    ("Письма призрака", "Ghost Letters"),
    ("Спайфол", "Spyfall"),
    ("Селестия", "Celestia"),
    ("За бортом", "Overboard"),
    ("Цитадели", "Citadels"),
    ("Бэнг", "Bang!"),
    ("Гномы-вредители", "Saboteur"),
    ("Feed the Kraken", "Feed the Kraken"),
    ("Экивоки", "Ekivoki"),
    ("Think Fast", "Think Fast"),
    ("Кровь на часовой башне", "Blood on the Clocktower"),
    ("Кемет", "Kemet"),
    ("Агрикола", "Agricola"),
    ("Дюна: Битва за Арракис", "Dune: Imperium"),
    ("Дюна: Апрайзинг", "Dune: Uprising"),
    ("Корни", "Root"),
    ("Цивилизация", "Civilization: A New Dawn"),
    ("Брасс: Бирмингем", "Brass: Birmingham"),
    ("Войны Черной Розы", "Black Rose Wars"),
    ("7 Wonders", "7 Wonders"),
    ("Замки Бургундии", "The Castles of Burgundy"),
    ("Эверделл", "Everdell"),
    ("Диксит", "Dixit"),
    ("Имаджинариум", "Imaginarium"),
    ("Гранд отель Австрия", "Grand Austria Hotel"),
    ("Азул", "Azul"),
    ("Азул: Летний Дворец", "Azul: Summer Pavilion"),
    ("Азул: Сады королевы", "Azul: Queen's Garden"),
    ("Каскадия", "Cascadia"),
    ("Остров кошек", "The Isle of Cats"),
    ("Крылья", "Wingspan"),
    ("Палео", "Paleo"),
    ("Индустрия", "Industry"),
    ("Катан", "Catan"),
    ("Непостижимое", "Unfathomable"),
    ("Иниш", "Inis"),
    ("Ганимед", "Ganymede"),
    ("Марракеш", "Marrakesh"),
    ("Робинзон Крузо", "Robinson Crusoe: Adventures on the Cursed Island"),
    ("Истанбул", "Istanbul"),
    ("Мор", "Plague"),
    ("Among Cultists", "Among Cultists"),
    ("Magic Maze", "Magic Maze"),
    ("Расцвет", "Raztsvet"),
    ("Small World", "Small World"),
    ("Легенды дикого запада", "Legends of the Wild West"),
    ("Каркассон", "Carcassonne"),
    ("Ticket to Ride", "Ticket to Ride"),
    ("Wyrmspan", "Wyrmspan"),
    ("Isidore", "Isidore"),
    ("Лоскутное королевство", "The Quilting Kingdom"),
    ("Ярость Дракулы", "Fury of Dracula"),
    ("Пакс Памир", "Pax Pamir"),
    ("Barenpark", "Barenpark"),
    ("Манчкин", "Munchkin"),
    ("Картографы", "Cartographers"),
    ("Welcome to Your Perfect Home", "Welcome to Your Perfect Home"),
    ("Not Enough Mana", "Not Enough Mana"),
    ("Диамант", "Diamant"),
    ("Гномы-вредители: Древние шахты", "Saboteur: The Lost Mines"),
    ("Scythe", "Scythe"),
    ("Сквозь века", "Through the Ages: A New Story of Civilization"),
    ("Терраформирование Марса", "Terraforming Mars"),
    ("Unconscious Mind", "Unconscious Mind"),
    ("Дорога приключений", "Adventure Road"),
    ("3000 негодяев", "3000 Scoundrels"),
    ("Эволюция", "Evolution"),
    ("Раскопки", "Excavation"),
    ("Санта-Моника", "Santa Monica"),
    ("Властелин колец", "The Lord of the Rings"),
    ("Кланк", "Clank!"),
    ("Грибы и корни", "Mushrooms and Roots"),
    ("Игра престолов", "Game of Thrones: The Board Game"),
    ("Ужас Аркхэма", "Arkham Horror"),
    ("Шакал", "Jackal"),
    ("Фоллаут", "Fallout"),
    ("Пандемия", "Pandemic"),
    ("Foodies", "Foodies"),
    ("Космический контакт", "Space Contact"),
    ("Королевство кроликов", "Rabbit Kingdom"),
    ("Подводные города", "Underwater Cities"),
    ("Fluxx", "Fluxx"),
    ("Бонанза", "Bohnanza"),
    ("Куры", "Chickens"),
    ("Deep Sea Adventures", "Deep Sea Adventure"),
    ("Carnegie", "Carnegie"),
    ("Ханаби", "Hanabi"),
    ("Red7", "Red7"),
    ("Ark Nova", "Ark Nova"),
]


def slugify_title(t):
    return slugify(t, allow_unicode=True)


class Command(BaseCommand):
    help = "Создание игр в БД по списку: поиск на BGG, парсинг, запись"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument("--headless", action="store_true", default=False)
        parser.add_argument("--no-translate", action="store_true", default=False)

    def handle(self, *args, **kwargs):
        limit = kwargs["limit"]
        headless = kwargs["headless"]
        no_translate = kwargs["no_translate"]

        games_to_process = GAMES[:limit] if limit else GAMES

        self.stdout.write(f"\nСоздание/обновление {len(games_to_process)} игр")

        created = 0
        updated = 0
        errors = 0

        p = sync_playwright().start()
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=headless,
            channel="chrome",
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        page = context.new_page()

        # ⏳ Ожидание Cloudflare: загружаем главную BGG, ждём пока пользователь пройдёт капчу
        self.stdout.write("\n⏳ Открываю BGG для прохождения Cloudflare (до 120 сек)...")
        self.stdout.write("   Пройдите капчу вручную в окне Chrome, если она появится.")
        self.stdout.flush()
        try:
            page.goto("https://boardgamegeek.com/", timeout=120000)
            # Ждём появления контента (категория, поиск, или любой элемент BGG)
            for _ in range(3):
                time.sleep(5)
                # Проверяем, загрузилась ли страница
                if page.query_selector("a[href*='/boardgamecategory/'], input[type='text'], .global-header"):
                    self.stdout.write("✅ Cloudflare пройден, начинаю парсинг!")
                    self.stdout.flush()
                    break
            else:
                self.stdout.write("⚠ Время ожидания истекло, пробую продолжить...")
                self.stdout.flush()
        except Exception as e:
            self.stdout.write(f"⚠ Ошибка загрузки: {e}")

        time.sleep(2)

        for idx, (title_ru, title_en) in enumerate(games_to_process, 1):
            self.stdout.write(f"\n[{idx}/{len(games_to_process)}] {title_ru} → {title_en}")
            self.stdout.flush()

            try:
                # ШАГ 1: Поиск на BGG
                search_url = f"https://boardgamegeek.com/search/boardgame?q={quote_plus(title_en)}"
                page.goto(search_url, timeout=60000)
                time.sleep(2)

                # Ищем ссылку с точным названием
                bgg_id = None
                links = page.query_selector_all("a[href*='/boardgame/']")
                for link in links:
                    text = (link.inner_text() or "").strip()
                    href = link.get_attribute("href") or ""
                    # Проверяем: текст ссылки содержит искомое название
                    if title_en.lower() in text.lower():
                        m = re.search(r'/boardgame(?:expansion)?/(\d+)', href)
                        if m:
                            bgg_id = int(m.group(1))
                            break

                if not bgg_id:
                    # Fallback: просто берём первую ссылку
                    for link in links[:3]:
                        href = link.get_attribute("href") or ""
                        m = re.search(r'/boardgame(?:expansion)?/(\d+)', href)
                        if m:
                            bgg_id = int(m.group(1))
                            self.stdout.write(f"  ⚠ нет точного совпадения, беру BGG#{bgg_id}")
                            break

                if not bgg_id:
                    self.stdout.write("  ❌ не найден на BGG")
                    errors += 1
                    continue

                # ШАГ 2: Открываем страницу игры
                page.goto(f"https://boardgamegeek.com/boardgame/{bgg_id}/", timeout=60000)
                try:
                    page.wait_for_selector(
                        "a[href*='/boardgamecategory/'], script[type='application/ld+json']",
                        timeout=30000,
                    )
                except Exception:
                    pass
                time.sleep(2)

                # ШАГ 3: JSON-LD (описание)
                desc_en = ""
                try:
                    ld = page.query_selector("script[type='application/ld+json']")
                    if ld:
                        data = json.loads(ld.inner_html())
                        if "BoardGame" in data.get("@type", ""):
                            desc_en = data.get("description", "") or ""
                except Exception:
                    pass

                if not desc_en:
                    try:
                        el = page.query_selector("[class*='game-description'], [class*='description'], article")
                        if el:
                            desc_en = el.inner_text().strip()
                    except Exception:
                        pass

                # ШАГ 4: Категории
                cats = set()
                try:
                    for el in page.query_selector_all("a[href*='/boardgamecategory/']"):
                        t = el.inner_text().strip()
                        if t and len(t) < 100 and t not in ("Party", "Game", "Board Game"):
                            cats.add(t)
                except Exception:
                    pass

                # ШАГ 5: Механики
                mechs = set()
                try:
                    for el in page.query_selector_all("a[href*='/boardgamemechanic/']"):
                        t = el.inner_text().strip()
                        if t and len(t) < 100:
                            mechs.add(t)
                except Exception:
                    pass

                # ШАГ 6: Создаём/обновляем игру
                slug = slugify_title(title_en)

                defaults = {
                    "slug": slug,
                    "description_en": desc_en or "",
                    "description_ru": "",
                    "min_players": 2,
                    "max_players": 4,
                    "play_time": 30,
                    "difficulty": 2,
                    "designer": "",
                    "bgg_type": "boardgame",
                    "is_active": True,
                }

                game, is_new = BoardGame.objects.get_or_create(
                    title=title_ru,
                    defaults=defaults,
                )

                if not is_new:
                    # Обновляем slug и описание
                    game.slug = slug
                    game.description_en = desc_en or game.description_en
                    game.save()
                    updated += 1
                else:
                    created += 1

                # Обновляем описание если оно появилось
                if desc_en and not game.description_en:
                    game.description_en = desc_en
                    game.save()

                # Присваиваем категории
                if cats:
                    objs = []
                    for c in cats:
                        obj, _ = Category.objects.get_or_create(
                            name=c, defaults={"slug": slugify(c)}
                        )
                        objs.append(obj)
                    game.categories.set(objs)

                # Присваиваем теги
                if mechs:
                    objs = []
                    for m in mechs:
                        obj, _ = Tag.objects.get_or_create(
                            name=m, defaults={"slug": slugify(m)}
                        )
                        objs.append(obj)
                    game.tags.set(objs)

                # Переводим описание
                if desc_en and not no_translate and not game.description_ru:
                    try:
                        from deep_translator import GoogleTranslator
                        translated = GoogleTranslator(source="en", target="ru").translate(desc_en[:5000])
                        if translated:
                            game.description_ru = translated
                            game.save()
                    except Exception as e:
                        self.stdout.write(f"  ⚠ перевод: {e}")

                status = "✅ создано" if is_new else "🔄 обновлено"
                self.stdout.write(f"  {status}: кат={len(cats)}, мех={len(mechs)}")

            except Exception as e:
                errors += 1
                self.stdout.write(f"  ⚠ ошибка: {e}")

            time.sleep(1.5)

        context.close()
        p.stop()
        self.stdout.write(f"\n✅ Создано: {created} | Обновлено: {updated} | Ошибок: {errors}")