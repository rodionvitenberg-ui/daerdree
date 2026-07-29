"""
Полный экспорт данных из локальной БД в JSON с natural keys.
Экспортирует: boardgames (Category, Tag, BoardGame, GameImage, Expansion),
              events (Event), menu (MenuCategory, MenuItem).
Booking НЕ экспортируется.

Использование:
    python manage.py export_full_data [--output full_dump.json]
"""

import json
from datetime import datetime
from django.core.management.base import BaseCommand

from boardgames.models import Category, Tag, BoardGame, GameImage, Expansion
from events.models import Event
from menu.models import MenuCategory, MenuItem


class Command(BaseCommand):
    help = 'Экспортирует все данные (boardgames, events, menu) в JSON с natural keys'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            default='full_dump.json',
            help='Путь к выходному JSON-файлу (по умолчанию full_dump.json)',
        )

    def handle(self, *args, **options):
        output_path = options['output']

        data = {
            "export_date": datetime.now().isoformat(),
            "export_version": 1,
            "boardgames": {
                "categories": self._export_categories(),
                "tags": self._export_tags(),
                "games": self._export_games(),
                "images": self._export_game_images(),
                "expansions": self._export_expansions(),
            },
            "events": self._export_events(),
            "menu": {
                "categories": self._export_menu_categories(),
                "items": self._export_menu_items(),
            },
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        self.stdout.write(self.style.SUCCESS(
            f'Дамп сохранён: {output_path}\n'
            f'  Категорий игр:     {len(data["boardgames"]["categories"])}\n'
            f'  Тегов:             {len(data["boardgames"]["tags"])}\n'
            f'  Игр:               {len(data["boardgames"]["games"])}\n'
            f'  Изображений игр:   {len(data["boardgames"]["images"])}\n'
            f'  Дополнений:        {len(data["boardgames"]["expansions"])}\n'
            f'  Событий:           {len(data["events"])}\n'
            f'  Категорий меню:    {len(data["menu"]["categories"])}\n'
            f'  Блюд меню:         {len(data["menu"]["items"])}'
        ))

    # =========================================================================
    # CATEGORIES
    # =========================================================================
    def _export_categories(self):
        result = []
        for obj in Category.objects.all().order_by('pk'):
            result.append({
                "slug": obj.slug,
                "name": obj.name,
                "icon": obj.icon.url if obj.icon else "",
                "description": obj.description,
            })
        return result

    # =========================================================================
    # TAGS
    # =========================================================================
    def _export_tags(self):
        result = []
        for obj in Tag.objects.all().order_by('pk'):
            result.append({
                "slug": obj.slug,
                "name": obj.name,
                "icon": obj.icon.url if obj.icon else "",
            })
        return result

    # =========================================================================
    # BOARD GAMES
    # =========================================================================
    def _export_games(self):
        result = []
        for game in BoardGame.objects.all().order_by('pk'):
            result.append({
                "slug": game.slug,
                "title": game.title,
                "categories": [c.slug for c in game.categories.all()],
                "tags": [t.slug for t in game.tags.all()],
                "description": game.description,
                "designer": game.designer,
                "bgg_type": game.bgg_type,
                "image": game.image.url if game.image else "",
                "setup_image": game.setup_image.url if game.setup_image else "",
                "min_players": game.min_players,
                "max_players": game.max_players,
                "play_time": game.play_time,
                "difficulty": game.difficulty,
                "is_active": game.is_active,
                "is_visible_ru": game.is_visible_ru,
                "is_visible_en": game.is_visible_en,
            })
        return result

    # =========================================================================
    # GAME IMAGES (галерея)
    # =========================================================================
    def _export_game_images(self):
        result = []
        for obj in GameImage.objects.select_related('game').all().order_by('pk'):
            result.append({
                "game_slug": obj.game.slug,
                "image": obj.image.url if obj.image else "",
                "image_type": obj.image_type,
                "order": obj.order,
                "alt": obj.alt,
            })
        return result

    # =========================================================================
    # EXPANSIONS
    # =========================================================================
    def _export_expansions(self):
        result = []
        for obj in Expansion.objects.select_related('game').all().order_by('pk'):
            result.append({
                "game_slug": obj.game.slug,
                "title": obj.title,
                "description": obj.description,
            })
        return result

    # =========================================================================
    # EVENTS
    # =========================================================================
    def _export_events(self):
        result = []
        for obj in Event.objects.all().order_by('pk'):
            result.append({
                "telegram_id": obj.telegram_id,
                "title": obj.title,
                "description": obj.description,
                "image": obj.image.url if obj.image else "",
                "title_en": obj.title_en or "",
                "description_en": obj.description_en or "",
                "event_date": obj.event_date.isoformat() if obj.event_date else None,
                "is_visible": obj.is_visible,
            })
        return result

    # =========================================================================
    # MENU CATEGORIES
    # =========================================================================
    def _export_menu_categories(self):
        result = []
        for obj in MenuCategory.objects.all().order_by('pk'):
            result.append({
                "slug": obj.slug,
                "name": obj.name,
                "order": obj.order,
            })
        return result

    # =========================================================================
    # MENU ITEMS
    # =========================================================================
    def _export_menu_items(self):
        result = []
        for obj in MenuItem.objects.select_related('category').all().order_by('pk'):
            result.append({
                "category_slug": obj.category.slug,
                "slug": obj.slug,
                "name": obj.name,
                "description": obj.description,
                "image": obj.image.url if obj.image else "",
                "price": str(obj.price),
                "volume": obj.volume,
                "is_vegetarian": obj.is_vegetarian,
                "is_available": obj.is_available,
            })
        return result