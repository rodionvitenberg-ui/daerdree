"""
Импорт данных boardgames из JSON-дампа с natural keys.
Существующие записи НЕ перезаписываются (приоритет у серверных данных).

Использование:
    python manage.py import_boardgames_data [--input boardgames_dump.json]
"""

import json
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from boardgames.models import Category, Tag, BoardGame, Expansion


class Command(BaseCommand):
    help = 'Импортирует игры, категории, теги и дополнения из JSON (natural keys)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--input',
            default='boardgames_dump.json',
            help='Путь к входному JSON-файлу (по умолчанию boardgames_dump.json)',
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

        bg_data = data.get("boardgames", data)
        # Поддержка обоих форматов: {boardgames: {...}} или плоский
        if "boardgames" in data:
            bg_data = data["boardgames"]

        with transaction.atomic():
            cats_result = self._import_categories(bg_data.get("categories", []))
            tags_result = self._import_tags(bg_data.get("tags", []))
            games_result = self._import_games(bg_data.get("games", []))
            expansions_result = self._import_expansions(bg_data.get("expansions", []))

        self.stdout.write(self.style.SUCCESS(
            f'Импорт завершён:\n'
            f'  Категории:  {cats_result}\n'
            f'  Теги:       {tags_result}\n'
            f'  Игры:       {games_result}\n'
            f'  Дополнения: {expansions_result}'
        ))

    # ------------------------------------------------------------------
    # Категории
    # ------------------------------------------------------------------

    def _import_categories(self, categories_data):
        created = 0
        updated = 0
        for item in categories_data:
            obj, was_created = Category.objects.update_or_create(
                name=item["name"],
                defaults={
                    "slug": item["slug"],
                    "description": item.get("description", ""),
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return f"создано {created}, обновлено {updated}"

    # ------------------------------------------------------------------
    # Теги
    # ------------------------------------------------------------------

    def _import_tags(self, tags_data):
        created = 0
        updated = 0
        for item in tags_data:
            obj, was_created = Tag.objects.update_or_create(
                name=item["name"],
                defaults={
                    "slug": item["slug"],
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1
        return f"создано {created}, обновлено {updated}"

    # ------------------------------------------------------------------
    # Игры
    # ------------------------------------------------------------------

    def _import_games(self, games_data):
        created = 0
        skipped = 0
        linked_cats = 0
        linked_tags = 0

        for item in games_data:
            slug = item["slug"]

            game, is_new = BoardGame.objects.get_or_create(
                slug=slug,
                defaults={
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
            )

            if is_new:
                created += 1
                # У новой игры добавляем категории и теги
                for cat_slug in item.get("categories", []):
                    try:
                        cat = Category.objects.get(slug=cat_slug)
                        game.categories.add(cat)
                        linked_cats += 1
                    except Category.DoesNotExist:
                        self.stdout.write(self.style.WARNING(
                            f'  Категория {cat_slug} не найдена — пропущена для игры {slug}'
                        ))
                for tag_slug in item.get("tags", []):
                    try:
                        tag = Tag.objects.get(slug=tag_slug)
                        game.tags.add(tag)
                        linked_tags += 1
                    except Tag.DoesNotExist:
                        self.stdout.write(self.style.WARNING(
                            f'  Тег {tag_slug} не найден — пропущен для игры {slug}'
                        ))
            else:
                skipped += 1
                # Существующая игра: только добавляем категории/теги, которых нет
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

        return f"создано {created}, пропущено {skipped} (добавлено связей: {linked_cats} категорий, {linked_tags} тегов)"

    # ------------------------------------------------------------------
    # Дополнения
    # ------------------------------------------------------------------

    def _import_expansions(self, expansions_data):
        created = 0
        skipped = 0
        missing_games = 0

        for item in expansions_data:
            try:
                game = BoardGame.objects.get(slug=item["game_slug"])
            except BoardGame.DoesNotExist:
                self.stdout.write(self.style.WARNING(
                    f'  Игра {item["game_slug"]} не найдена — дополнение "{item["title"]}" пропущено'
                ))
                missing_games += 1
                continue

            obj, is_new = Expansion.objects.get_or_create(
                game=game,
                title=item["title"],
                defaults={
                    "description": item.get("description", ""),
                }
            )
            if is_new:
                created += 1
            else:
                skipped += 1

        return f"создано {created}, пропущено {skipped}, игр не найдено {missing_games}"