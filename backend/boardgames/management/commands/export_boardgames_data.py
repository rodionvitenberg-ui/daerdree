"""
Экспорт данных boardgames (Category, Tag, BoardGame, Expansion)
в JSON с natural keys (slug) для безопасного импорта на сервер.

Использование:
    python manage.py export_boardgames_data [--output boardgames_dump.json]
"""

import json
import os
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from boardgames.models import Category, Tag, BoardGame, Expansion


class Command(BaseCommand):
    help = 'Экспортирует игры, категории, теги и дополнения в JSON (natural keys)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            default='boardgames_dump.json',
            help='Путь к выходному JSON-файлу (по умолчанию boardgames_dump.json)',
        )

    def handle(self, *args, **options):
        output_path = options['output']

        # Собираем данные
        data = {
            "export_date": datetime.now().isoformat(),
            "export_version": 2,  # версия формата экспорта
            "boardgames": {
                "categories": self._export_categories(),
                "tags": self._export_tags(),
                "games": self._export_games(),
                "expansions": self._export_expansions(),
            }
        }

        # Записываем
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        total_cats = len(data["boardgames"]["categories"])
        total_tags = len(data["boardgames"]["tags"])
        total_games = len(data["boardgames"]["games"])
        total_expansions = len(data["boardgames"]["expansions"])

        self.stdout.write(self.style.SUCCESS(
            f'Дамп сохранён: {output_path}\n'
            f'  Категорий: {total_cats}\n'
            f'  Тегов:     {total_tags}\n'
            f'  Игр:       {total_games}\n'
            f'  Дополнений: {total_expansions}'
        ))

    # ------------------------------------------------------------------

    def _export_categories(self):
        """Экспорт категорий (natural key = slug)."""
        result = []
        for cat in Category.objects.all().order_by('pk'):
            result.append({
                "slug": cat.slug,
                "name": cat.name,
                "icon": cat.icon.url if cat.icon else "",
                "description": cat.description,
            })
        return result

    def _export_tags(self):
        """Экспорт тегов (natural key = slug)."""
        result = []
        for tag in Tag.objects.all().order_by('pk'):
            result.append({
                "slug": tag.slug,
                "name": tag.name,
                "icon": tag.icon.url if tag.icon else "",
            })
        return result

    def _export_games(self):
        """Экспорт игр с M2M-связями через slug."""
        result = []
        for game in BoardGame.objects.all().order_by('pk'):
            entry = {
                "slug": game.slug,
                "title": game.title,
                # Категории и теги — списком slug'ов
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
            }
            result.append(entry)
        return result

    def _export_expansions(self):
        """Экспорт дополнений (привязка к игре через slug)."""
        result = []
        for exp in Expansion.objects.all().order_by('pk'):
            result.append({
                "game_slug": exp.game.slug,
                "title": exp.title,
                "description": exp.description,
            })
        return result