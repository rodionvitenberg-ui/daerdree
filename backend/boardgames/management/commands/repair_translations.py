"""
Ремонт translation-полей (_ru/_en) на сервере по данным из полного дампа.
Заполняет только пустые поля, НЕ перезаписывает существующие.
Ничего не удаляет, не меняет M2M-связи.

Использование:
    python manage.py repair_translations --input full_dump.json
"""

import json
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from boardgames.models import Category, Tag, BoardGame, Expansion


# Список translation-полей для каждой модели
TRANSLATION_FIELDS = {
    Category: [
        ("name_ru", "name", True),
        ("name_en", "name", True),
        ("description_ru", "description", True),
        ("description_en", "description", True),
    ],
    Tag: [
        ("name_ru", "name", True),
        ("name_en", "name", True),
    ],
    BoardGame: [
        ("title_ru", "title", True),
        ("title_en", "title", True),
        ("description_ru", "description", True),
        ("description_en", "description", True),
    ],
    Expansion: [
        ("title_ru", "title", True),
        ("title_en", "title", True),
        ("description_ru", "description", True),
        ("description_en", "description", True),
    ],
}


def _repair_fields(obj, item, model):
    """
    Проставляет пустые translation-поля для obj из данных item.
    Возвращает количество исправленных полей.
    """
    updated = 0
    for field_name, fallback_field, has_fallback in TRANSLATION_FIELDS.get(model, []):
        current = getattr(obj, field_name, None)
        if current is None or current == '':
            value = item.get(field_name)
            if value:
                setattr(obj, field_name, value)
                updated += 1
            elif has_fallback and item.get(fallback_field):
                fallback = item.get(fallback_field)
                if fallback:
                    setattr(obj, field_name, fallback)
                    updated += 1
    if updated:
        obj.save(update_fields=[f[0] for f in TRANSLATION_FIELDS.get(model, [])])
    return updated


class Command(BaseCommand):
    help = 'Чинит пустые translation-поля (_ru/_en) по данным из дампа'

    def add_arguments(self, parser):
        parser.add_argument(
            '--input',
            default='full_dump.json',
            help='Путь к JSON-дампу (по умолчанию full_dump.json)',
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
                "categories": self._fix_categories(data.get("boardgames", {}).get("categories", [])),
                "tags": self._fix_tags(data.get("boardgames", {}).get("tags", [])),
                "games": self._fix_games(data.get("boardgames", {}).get("games", [])),
                "expansions": self._fix_expansions(data.get("boardgames", {}).get("expansions", [])),
            }

        self.stdout.write(self.style.SUCCESS(
            f'\n===== РЕМОНТ ЗАВЕРШЁН =====\n'
            f'Категории:  {stats["categories"]}\n'
            f'Теги:       {stats["tags"]}\n'
            f'Игры:       {stats["games"]}\n'
            f'Дополнения: {stats["expansions"]}'
        ))

    # =========================================================================
    # CATEGORIES
    # =========================================================================
    def _fix_categories(self, data):
        ok = 0
        fixed = 0
        for item in data:
            try:
                obj = Category.objects.get(slug=item["slug"])
                ok += 1
                fixed += _repair_fields(obj, item, Category)
            except Category.DoesNotExist:
                pass
        return f"найдено {ok}, исправлено полей {fixed}"

    # =========================================================================
    # TAGS
    # =========================================================================
    def _fix_tags(self, data):
        ok = 0
        fixed = 0
        for item in data:
            try:
                obj = Tag.objects.get(slug=item["slug"])
                ok += 1
                fixed += _repair_fields(obj, item, Tag)
            except Tag.DoesNotExist:
                pass
        return f"найдено {ok}, исправлено полей {fixed}"

    # =========================================================================
    # BOARD GAMES
    # =========================================================================
    def _fix_games(self, data):
        ok = 0
        fixed = 0
        for item in data:
            try:
                obj = BoardGame.objects.get(slug=item["slug"])
                ok += 1
                fixed += _repair_fields(obj, item, BoardGame)
            except BoardGame.DoesNotExist:
                pass
        return f"найдено {ok}, исправлено полей {fixed}"

    # =========================================================================
    # EXPANSIONS
    # =========================================================================
    def _fix_expansions(self, data):
        ok = 0
        fixed = 0
        for item in data:
            try:
                game = BoardGame.objects.get(slug=item["game_slug"])
                obj = Expansion.objects.get(game=game, title=item["title"])
                ok += 1
                fixed += _repair_fields(obj, item, Expansion)
            except (BoardGame.DoesNotExist, Expansion.DoesNotExist):
                self.stdout.write(self.style.WARNING(
                    f'  Дополнение "{item["title"]}" (игра "{item["game_slug"]}") не найдено — пропущено'
                ))
        return f"найдено {ok}, исправлено полей {fixed}"