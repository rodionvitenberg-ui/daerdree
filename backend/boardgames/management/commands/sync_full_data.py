"""
Импорт данных из полного JSON-дампа с перезаписью существующих записей (sync).

В отличие от import_full_data (только INSERT), этот скрипт обновляет
существующие записи:

  - ✅ Категории, теги, игры, дополнения, события, меню — перезаписываются
  - ✅ Изображения (image, setup_image, icon) тоже перезаписываются из дампа
  - ❌ GameImage (галерея) — только INSERT, существующие не трогаем
  - ✅ M2M-связи (categories, tags) синхронизируются — устанавливаются ровно
    те, что указаны в дампе (старые лишние удаляются)

Использование:
    python manage.py sync_full_data [--input full_dump.json]
"""

import json
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from boardgames.models import Category, Tag, BoardGame, GameImage, Expansion
from events.models import Event
from menu.models import MenuCategory, MenuItem


class Command(BaseCommand):
    help = 'Синхронизация данных из JSON-дампа с перезаписью всех полей'

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
                "categories": self._sync_categories(
                    data.get("boardgames", {}).get("categories", [])
                ),
                "tags": self._sync_tags(
                    data.get("boardgames", {}).get("tags", [])
                ),
                "games": self._sync_games(
                    data.get("boardgames", {}).get("games", [])
                ),
                "images": self._sync_game_images(
                    data.get("boardgames", {}).get("images", [])
                ),
                "expansions": self._sync_expansions(
                    data.get("boardgames", {}).get("expansions", [])
                ),
                "events": self._sync_events(
                    data.get("events", [])
                ),
                "menu_categories": self._sync_menu_categories(
                    data.get("menu", {}).get("categories", [])
                ),
                "menu_items": self._sync_menu_items(
                    data.get("menu", {}).get("items", [])
                ),
            }

        self.stdout.write(self.style.SUCCESS(
            f'\n===== СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА =====\n'
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
    # CATEGORIES — update_or_create по slug
    # icon устанавливаем отдельно (ImageField)
    # =========================================================================
    def _sync_categories(self, data):
        created = 0
        updated = 0
        for item in data:
            defaults = {
                "name": item["name"],
                "description": item.get("description", ""),
                # icon — отдельно
            }
            if "name_ru" in item:
                defaults["name_ru"] = item["name_ru"] or item["name"]
            if "name_en" in item:
                defaults["name_en"] = item["name_en"] or item["name"]
            if "description_ru" in item:
                defaults["description_ru"] = item["description_ru"] or ""
            if "description_en" in item:
                defaults["description_en"] = item["description_en"] or ""

            obj, was_created = Category.objects.update_or_create(
                slug=item["slug"],
                defaults=defaults,
            )
            # icon напрямую в БД (обходим ImageField)
            Category.objects.filter(slug=item["slug"]).update(
                icon=item.get("icon", ""),
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return f"создано {created}, обновлено {updated}"

    # =========================================================================
    # TAGS — update_or_create по slug
    # icon устанавливаем отдельно (ImageField)
    # =========================================================================
    def _sync_tags(self, data):
        created = 0
        updated = 0
        for item in data:
            defaults = {
                "name": item["name"],
                # icon — отдельно
            }
            if "name_ru" in item:
                defaults["name_ru"] = item["name_ru"] or item["name"]
            if "name_en" in item:
                defaults["name_en"] = item["name_en"] or item["name"]

            obj, was_created = Tag.objects.update_or_create(
                slug=item["slug"],
                defaults=defaults,
            )
            # icon напрямую в БД (обходим ImageField)
            Tag.objects.filter(slug=item["slug"]).update(
                icon=item.get("icon", ""),
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return f"создано {created}, обновлено {updated}"

    # =========================================================================
    # BOARD GAMES — update_or_create по slug
    # Image-поля устанавливаем отдельно через update() (прямая запись в БД)
    # M2M-связи синхронизируем (удаляем старые, добавляем новые)
    # =========================================================================
    def _sync_games(self, data):
        created = 0
        updated = 0
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
                # image/setup_image устанавливаем отдельно ниже
            }
            if "title_ru" in item:
                defaults["title_ru"] = item["title_ru"] or item["title"]
            if "title_en" in item:
                defaults["title_en"] = item["title_en"] or item["title"]
            if "description_ru" in item:
                defaults["description_ru"] = item["description_ru"] or ""
            if "description_en" in item:
                defaults["description_en"] = item["description_en"] or ""

            game, was_created = BoardGame.objects.update_or_create(
                slug=item["slug"],
                defaults=defaults,
            )

            # Устанавливаем image/setup_image напрямую в БД (обходим ImageField валидацию)
            BoardGame.objects.filter(slug=item["slug"]).update(
                image=item.get("image", ""),
                setup_image=item.get("setup_image", ""),
            )
            # Обновляем объект в памяти для дальнейшей работы
            game.image.name = item.get("image", "")
            game.setup_image.name = item.get("setup_image", "")

            # Синхронизируем M2M-связи (полная переустановка)
            cat_slugs = item.get("categories", [])
            existing_cats = set(game.categories.values_list("slug", flat=True))
            desired_cats = set(cat_slugs)

            # Добавляем недостающие
            for cat_slug in (desired_cats - existing_cats):
                try:
                    cat = Category.objects.get(slug=cat_slug)
                    game.categories.add(cat)
                    linked_cats += 1
                except Category.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f'  Категория "{cat_slug}" не найдена — пропущена для "{item["slug"]}"'
                    ))

            # Удаляем лишние (кроме случая, когда игра новая — у неё и так только то, что добавили)
            if not was_created:
                for cat_slug in (existing_cats - desired_cats):
                    try:
                        cat = Category.objects.get(slug=cat_slug)
                        game.categories.remove(cat)
                    except Category.DoesNotExist:
                        pass

            # Теги
            tag_slugs = item.get("tags", [])
            existing_tags = set(game.tags.values_list("slug", flat=True))
            desired_tags = set(tag_slugs)

            for tag_slug in (desired_tags - existing_tags):
                try:
                    tag = Tag.objects.get(slug=tag_slug)
                    game.tags.add(tag)
                    linked_tags += 1
                except Tag.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f'  Тег "{tag_slug}" не найден — пропущен для "{item["slug"]}"'
                    ))

            if not was_created:
                for tag_slug in (existing_tags - desired_tags):
                    try:
                        tag = Tag.objects.get(slug=tag_slug)
                        game.tags.remove(tag)
                    except Tag.DoesNotExist:
                        pass

            if was_created:
                created += 1
            else:
                updated += 1

        return f"создано {created}, обновлено {updated} (синхронизировано связей: {linked_cats} кат., {linked_tags} тегов)"

    # =========================================================================
    # GAME IMAGES — ТОЛЬКО INSERT, никогда не перезаписываем изображения
    # =========================================================================
    def _sync_game_images(self, data):
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
    # EXPANSIONS — update_or_create по game + title
    # =========================================================================
    def _sync_expansions(self, data):
        created = 0
        updated = 0
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

            obj, was_created = Expansion.objects.update_or_create(
                game=game,
                title=item["title"],
                defaults=defaults,
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return f"создано {created}, обновлено {updated}, игр не найдено {missing_games}"

    # =========================================================================
    # EVENTS — update_or_create по telegram_id (или title + date)
    # image устанавливаем отдельно (ImageField)
    # =========================================================================
    def _sync_events(self, data):
        created = 0
        updated = 0

        for item in data:
            telegram_id = item.get("telegram_id")

            defaults = {
                "title": item["title"],
                "description": item.get("description", ""),
                "title_en": item.get("title_en", ""),
                "description_en": item.get("description_en", ""),
                "event_date": parse_datetime(item["event_date"]) if item.get("event_date") else None,
                "is_visible": item.get("is_visible", True),
                # image — отдельно
            }

            if telegram_id:
                obj, was_created = Event.objects.update_or_create(
                    telegram_id=telegram_id,
                    defaults=defaults,
                )
            else:
                event_date = parse_datetime(item["event_date"]) if item.get("event_date") else None
                obj, was_created = Event.objects.update_or_create(
                    title=item["title"],
                    event_date=event_date,
                    defaults=defaults,
                )

            # image напрямую в БД (обходим ImageField)
            if telegram_id:
                Event.objects.filter(telegram_id=telegram_id).update(
                    image=item.get("image", ""),
                )
            else:
                Event.objects.filter(
                    title=item["title"],
                    event_date=parse_datetime(item["event_date"]) if item.get("event_date") else None,
                ).update(
                    image=item.get("image", ""),
                )

            if was_created:
                created += 1
            else:
                updated += 1

        return f"создано {created}, обновлено {updated}"

    # =========================================================================
    # MENU CATEGORIES — update_or_create по slug
    # =========================================================================
    def _sync_menu_categories(self, data):
        created = 0
        updated = 0
        for item in data:
            obj, was_created = MenuCategory.objects.update_or_create(
                slug=item["slug"],
                defaults={
                    "name": item["name"],
                    "order": item.get("order", 0),
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return f"создано {created}, обновлено {updated}"

    # =========================================================================
    # MENU ITEMS — update_or_create по slug
    # image устанавливаем отдельно (ImageField)
    # =========================================================================
    def _sync_menu_items(self, data):
        created = 0
        updated = 0
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

            defaults = {
                "category": category,
                "name": item["name"],
                "description": item.get("description", ""),
                "price": item.get("price", "0.00"),
                "volume": item.get("volume", ""),
                "is_vegetarian": item.get("is_vegetarian", False),
                "is_available": item.get("is_available", True),
                # image — отдельно
            }

            obj, was_created = MenuItem.objects.update_or_create(
                slug=item["slug"],
                defaults=defaults,
            )
            # image напрямую в БД (обходим ImageField)
            MenuItem.objects.filter(slug=item["slug"]).update(
                image=item.get("image", ""),
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return f"создано {created}, обновлено {updated}, категорий не найдено {missing_cats}"