"""
Безопасный импорт данных из полного JSON-дампа (export_full_data).
Существующие записи НЕ перезаписываются, НЕ удаляются.
Только INSERT новых записей и добавление M2M-связей.

Использование:
    python manage.py import_full_data [--input full_dump.json]
"""

import json
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from boardgames.models import Category, Tag, BoardGame, GameImage, Expansion
from events.models import Event
from menu.models import MenuCategory, MenuItem
from django.utils.dateparse import parse_datetime


class Command(BaseCommand):
    help = 'Безопасный импорт данных (только INSERT, не UPDATE/DELETE)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--input',
            default='full_dump.json',
            help='Путь к входному JSON-файлу (по умолчанию full_dump.json)',
        )

    def handle(self, *args, **options):
        input_path = options['input']

        try:
            with open(input_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            raise CommandError(f'Файл не найден: {input_path}')
        except json.JSONDecodeError as e:
            raise CommandError(f'Ошибка парсинга JSON: {e}')

        with transaction.atomic():
            stats = {
                "categories": self._import_categories(data.get("boardgames", {}).get("categories", [])),
                "tags": self._import_tags(data.get("boardgames", {}).get("tags", [])),
                "games": self._import_games(data.get("boardgames", {}).get("games", [])),
                "images": self._import_game_images(data.get("boardgames", {}).get("images", [])),
                "expansions": self._import_expansions(data.get("boardgames", {}).get("expansions", [])),
                "events": self._import_events(data.get("events", [])),
                "menu_categories": self._import_menu_categories(data.get("menu", {}).get("categories", [])),
                "menu_items": self._import_menu_items(data.get("menu", {}).get("items", [])),
            }

        self.stdout.write(self.style.SUCCESS(
            f'\n===== ИМПОРТ ЗАВЕРШЁН =====\n'
            f'Категории игр:     {stats["categories"]}\n'
            f'Теги:              {stats["tags"]}\n'
            f'Игры:              {stats["games"]}\n'
            f'Изображения игр:   {stats["images"]}\n'
            f'Дополнения:        {stats["expansions"]}\n'
            f'События:           {stats["events"]}\n'
            f'Категории меню:    {stats["menu_categories"]}\n'
            f'Блюда меню:        {stats["menu_items"]}'
        ))

    # =========================================================================
    # CATEGORIES — get_or_create по slug, НЕ перезаписываем поля
    # =========================================================================
    def _import_categories(self, data):
        created = 0
        skipped = 0
        for item in data:
            defaults = {
                "name": item["name"],
                "description": item.get("description", ""),
            }
            if "name_ru" in item:
                defaults["name_ru"] = item["name_ru"] or item["name"]
            if "name_en" in item:
                defaults["name_en"] = item["name_en"] or item["name"]
            if "description_ru" in item:
                defaults["description_ru"] = item["description_ru"] or ""
            if "description_en" in item:
                defaults["description_en"] = item["description_en"] or ""

            obj, is_new = Category.objects.get_or_create(
                slug=item["slug"],
                defaults=defaults,
            )
            if is_new:
                created += 1
            else:
                skipped += 1
        return f"создано {created}, пропущено {skipped}"

    # =========================================================================
    # TAGS — get_or_create по slug
    # =========================================================================
    def _import_tags(self, data):
        created = 0
        skipped = 0
        for item in data:
            defaults = {
                "name": item["name"],
            }
            if "name_ru" in item:
                defaults["name_ru"] = item["name_ru"] or item["name"]
            if "name_en" in item:
                defaults["name_en"] = item["name_en"] or item["name"]

            obj, is_new = Tag.objects.get_or_create(
                slug=item["slug"],
                defaults=defaults,
            )
            if is_new:
                created += 1
            else:
                skipped += 1
        return f"создано {created}, пропущено {skipped}"

    # =========================================================================
    # BOARD GAMES — get_or_create по slug
    # Существующие игры НЕ перезаписываем, только добавляем M2M связи
    # =========================================================================
    def _import_games(self, data):
        created = 0
        skipped = 0
        linked_cats = 0
        linked_tags = 0

        for item in data:
            defaults = {
                "title": item["title"],
                "description": item.get("description", ""),
                "designer": item.get("designer", ""),
                "bgg_type": item.get("bgg_type", "boardgame"),
                "min_players": item.get("min_players", 2),
                "max_players": item.get("max_players", 4),
                "play_time": item.get("play_time", 30),
                "difficulty": item.get("difficulty", 2),
                "is_active": item.get("is_active", True),
                "is_visible_ru": item.get("is_visible_ru", True),
                "is_visible_en": item.get("is_visible_en", False),
            }
            if "title_ru" in item:
                defaults["title_ru"] = item["title_ru"] or item["title"]
            if "title_en" in item:
                defaults["title_en"] = item["title_en"] or item["title"]
            if "description_ru" in item:
                defaults["description_ru"] = item["description_ru"] or ""
            if "description_en" in item:
                defaults["description_en"] = item["description_en"] or ""

            game, is_new = BoardGame.objects.get_or_create(
                slug=item["slug"],
                defaults=defaults,
            )

            if is_new:
                created += 1
                # Новая игра — добавляем все связи
                for cat_slug in item.get("categories", []):
                    try:
                        cat = Category.objects.get(slug=cat_slug)
                        game.categories.add(cat)
                        linked_cats += 1
                    except Category.DoesNotExist:
                        self.stdout.write(self.style.WARNING(
                            f'  Категория "{cat_slug}" не найдена — пропущена для игры "{item["slug"]}"'
                        ))
                for tag_slug in item.get("tags", []):
                    try:
                        tag = Tag.objects.get(slug=tag_slug)
                        game.tags.add(tag)
                        linked_tags += 1
                    except Tag.DoesNotExist:
                        self.stdout.write(self.style.WARNING(
                            f'  Тег "{tag_slug}" не найден — пропущен для игры "{item["slug"]}"'
                        ))
            else:
                skipped += 1
                # Существующая игра — только добавляем НОВЫЕ связи, не удаляем старые
                existing_cat_slugs = set(game.categories.values_list("slug", flat=True))
                for cat_slug in item.get("categories", []):
                    if cat_slug not in existing_cat_slugs:
                        try:
                            cat = Category.objects.get(slug=cat_slug)
                            game.categories.add(cat)
                            linked_cats += 1
                        except Category.DoesNotExist:
                            pass

                existing_tag_slugs = set(game.tags.values_list("slug", flat=True))
                for tag_slug in item.get("tags", []):
                    if tag_slug not in existing_tag_slugs:
                        try:
                            tag = Tag.objects.get(slug=tag_slug)
                            game.tags.add(tag)
                            linked_tags += 1
                        except Tag.DoesNotExist:
                            pass

        return f"создано {created}, пропущено {skipped} (добавлено связей: {linked_cats} кат., {linked_tags} тегов)"

    # =========================================================================
    # GAME IMAGES — get_or_create по game + image_type + order
    # =========================================================================
    def _import_game_images(self, data):
        created = 0
        skipped = 0
        missing_games = 0

        for item in data:
            try:
                game = BoardGame.objects.get(slug=item["game_slug"])
            except BoardGame.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'  Игра "{item["game_slug"]}" не найдена — изображение пропущено'
                ))
                missing_games += 1
                continue

            obj, is_new = GameImage.objects.get_or_create(
                game=game,
                image_type=item.get("image_type", "gallery"),
                order=item.get("order", 0),
                defaults={
                    "alt": item.get("alt", ""),
                }
            )
            if is_new:
                created += 1
            else:
                skipped += 1

        return f"создано {created}, пропущено {skipped}, игр не найдено {missing_games}"

    # =========================================================================
    # EXPANSIONS — get_or_create по game + title
    # =========================================================================
    def _import_expansions(self, data):
        created = 0
        skipped = 0
        missing_games = 0

        for item in data:
            try:
                game = BoardGame.objects.get(slug=item["game_slug"])
            except BoardGame.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'  Игра "{item["game_slug"]}" не найдена — дополнение "{item["title"]}" пропущено'
                ))
                missing_games += 1
                continue

            defaults = {
                "description": item.get("description", ""),
            }
            if "title_ru" in item:
                defaults["title_ru"] = item["title_ru"] or item["title"]
            if "title_en" in item:
                defaults["title_en"] = item["title_en"] or item["title"]
            if "description_ru" in item:
                defaults["description_ru"] = item["description_ru"] or ""
            if "description_en" in item:
                defaults["description_en"] = item["description_en"] or ""

            obj, is_new = Expansion.objects.get_or_create(
                game=game,
                title=item["title"],
                defaults=defaults,
            )
            if is_new:
                created += 1
            else:
                skipped += 1

        return f"создано {created}, пропущено {skipped}, игр не найдено {missing_games}"

    # =========================================================================
    # EVENTS — get_or_create по telegram_id; если None — по title + event_date
    # =========================================================================
    def _import_events(self, data):
        created = 0
        skipped = 0

        for item in data:
            telegram_id = item.get("telegram_id")

            if telegram_id:
                obj, is_new = Event.objects.get_or_create(
                    telegram_id=telegram_id,
                    defaults={
                        "title": item["title"],
                        "description": item.get("description", ""),
                        "title_en": item.get("title_en", ""),
                        "description_en": item.get("description_en", ""),
                        "event_date": parse_datetime(item["event_date"]) if item.get("event_date") else None,
                        "is_visible": item.get("is_visible", True),
                    }
                )
            else:
                # Нет telegram_id — ищем по заголовку + дате
                event_date = parse_datetime(item["event_date"]) if item.get("event_date") else None
                obj, is_new = Event.objects.get_or_create(
                    title=item["title"],
                    event_date=event_date,
                    defaults={
                        "description": item.get("description", ""),
                        "title_en": item.get("title_en", ""),
                        "description_en": item.get("description_en", ""),
                        "is_visible": item.get("is_visible", True),
                    }
                )

            if is_new:
                created += 1
            else:
                skipped += 1

        return f"создано {created}, пропущено {skipped}"

    # =========================================================================
    # MENU CATEGORIES — get_or_create по slug
    # =========================================================================
    def _import_menu_categories(self, data):
        created = 0
        skipped = 0
        for item in data:
            obj, is_new = MenuCategory.objects.get_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "order": item.get("order", 0),
                }
            )
            if is_new:
                created += 1
            else:
                skipped += 1
        return f"создано {created}, пропущено {skipped}"

    # =========================================================================
    # MENU ITEMS — get_or_create по slug
    # =========================================================================
    def _import_menu_items(self, data):
        created = 0
        skipped = 0
        missing_cats = 0

        for item in data:
            try:
                category = MenuCategory.objects.get(slug=item["category_slug"])
            except MenuCategory.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'  Категория меню "{item["category_slug"]}" не найдена — блюдо "{item["name"]}" пропущено'
                ))
                missing_cats += 1
                continue

            obj, is_new = MenuItem.objects.get_or_create(
                slug=item["slug"],
                defaults={
                    "category": category,
                    "name": item["name"],
                    "description": item.get("description", ""),
                    "price": item.get("price", "0.00"),
                    "volume": item.get("volume", ""),
                    "is_vegetarian": item.get("is_vegetarian", False),
                    "is_available": item.get("is_available", True),
                }
            )
            if is_new:
                created += 1
            else:
                skipped += 1

        return f"создано {created}, пропущено {skipped}, категорий не найдено {missing_cats}"