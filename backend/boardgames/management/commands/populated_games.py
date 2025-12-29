# your_app_name/management/commands/populate_games.py

from django.core.management.base import BaseCommand
from django.utils.text import slugify
from boardgames.models import BoardGame, Category, Tag  # <--- ЗАМЕНИ ТОЧКИ НА НАЗВАНИЕ ТВОЕГО ПРИЛОЖЕНИЯ (например, from library.models import ...)

class Command(BaseCommand):
    help = 'Заполняет базу данных тестовыми играми'

    def handle(self, *args, **kwargs):
        self.stdout.write("Начинаем заполнение базы...")

        # 1. Создаем Категории
        categories_data = [
            "Стратегия", "Семейная", "Патигейм", "Абстракт", "Варгейм", "Тематическая", "Детская"
        ]
        
        categories = {}
        for name in categories_data:
            cat, created = Category.objects.get_or_create(
                name=name,
                defaults={'slug': slugify(name, allow_unicode=True), 'description': f'Лучшие игры в жанре {name}'}
            )
            categories[name] = cat
            if created:
                self.stdout.write(f'Создана категория: {name}')

        # 2. Создаем Теги (Механики)
        tags_data = [
            "Экономика", "Карточная", "На кубиках", "Кооператив", "Контроль территорий", 
            "Скрытые роли", "Детектив", "Космос", "Фэнтези", "Строительство", "Для двоих"
        ]

        tags = {}
        for name in tags_data:
            tag, created = Tag.objects.get_or_create(
                name=name,
                defaults={'slug': slugify(name, allow_unicode=True)}
            )
            tags[name] = tag
            if created:
                self.stdout.write(f'Создан тег: {name}')

        # 3. Список Игр (30 штук)
        games_data = [
            # Стратегии
            {"title": "Terraforming Mars", "cat": "Стратегия", "tags": ["Экономика", "Космос", "Строительство"], "diff": 3, "min": 1, "max": 5, "time": 120},
            {"title": "Scythe", "cat": "Стратегия", "tags": ["Экономика", "Контроль территорий", "Фэнтези"], "diff": 4, "min": 1, "max": 5, "time": 115},
            {"title": "Dune: Imperium", "cat": "Стратегия", "tags": ["Карточная", "Космос", "Контроль территорий"], "diff": 3, "min": 1, "max": 4, "time": 90},
            {"title": "Brass: Birmingham", "cat": "Стратегия", "tags": ["Экономика", "Строительство"], "diff": 4, "min": 2, "max": 4, "time": 120},
            {"title": "Ark Nova", "cat": "Стратегия", "tags": ["Экономика", "Карточная", "Строительство"], "diff": 4, "min": 1, "max": 4, "time": 150},
            {"title": "Spirit Island", "cat": "Стратегия", "tags": ["Кооператив", "Фэнтези", "Карточная"], "diff": 4, "min": 1, "max": 4, "time": 120},
            {"title": "Wingspan", "cat": "Семейная", "tags": ["Карточная", "Экономика"], "diff": 2, "min": 1, "max": 5, "time": 60},
            {"title": "Everdell", "cat": "Семейная", "tags": ["Фэнтези", "Строительство"], "diff": 3, "min": 1, "max": 4, "time": 60},
            {"title": "7 Wonders Duel", "cat": "Стратегия", "tags": ["Карточная", "Для двоих", "Строительство"], "diff": 2, "min": 2, "max": 2, "time": 30},
            
            # Семейные и Гейтвеи
            {"title": "Catan", "cat": "Семейная", "tags": ["Экономика", "Строительство", "На кубиках"], "diff": 2, "min": 3, "max": 4, "time": 60},
            {"title": "Ticket to Ride", "cat": "Семейная", "tags": ["Строительство", "Карточная"], "diff": 1, "min": 2, "max": 5, "time": 45},
            {"title": "Carcassonne", "cat": "Семейная", "tags": ["Строительство", "Контроль территорий"], "diff": 1, "min": 2, "max": 5, "time": 35},
            {"title": "Pandemic", "cat": "Семейная", "tags": ["Кооператив", "Карточная"], "diff": 2, "min": 2, "max": 4, "time": 45},
            {"title": "Splendor", "cat": "Семейная", "tags": ["Экономика", "Карточная"], "diff": 1, "min": 2, "max": 4, "time": 30},
            {"title": "Azul", "cat": "Абстракт", "tags": ["Строительство"], "diff": 1, "min": 2, "max": 4, "time": 30},
            {"title": "Patchwork", "cat": "Абстракт", "tags": ["Для двоих", "Экономика"], "diff": 1, "min": 2, "max": 2, "time": 20},
            {"title": "Cascadia", "cat": "Абстракт", "tags": ["Строительство"], "diff": 1, "min": 1, "max": 4, "time": 30},
            
            # Патигеймы
            {"title": "Codenames", "cat": "Патигейм", "tags": ["Карточная", "Детектив"], "diff": 1, "min": 2, "max": 8, "time": 15},
            {"title": "Dixit", "cat": "Патигейм", "tags": ["Карточная", "Фэнтези"], "diff": 1, "min": 3, "max": 6, "time": 30},
            {"title": "The Resistance", "cat": "Патигейм", "tags": ["Скрытые роли", "Карточная"], "diff": 1, "min": 5, "max": 10, "time": 30},
            {"title": "Spyfall", "cat": "Патигейм", "tags": ["Скрытые роли", "Детектив"], "diff": 1, "min": 3, "max": 8, "time": 15},
            {"title": "Just One", "cat": "Патигейм", "tags": ["Кооператив"], "diff": 1, "min": 3, "max": 7, "time": 20},
            
            # Тематик и Варгеймы
            {"title": "Gloomhaven", "cat": "Тематическая", "tags": ["Кооператив", "Фэнтези", "Карточная"], "diff": 5, "min": 1, "max": 4, "time": 150},
            {"title": "Nemesis", "cat": "Тематическая", "tags": ["Космос", "Скрытые роли", "На кубиках"], "diff": 4, "min": 1, "max": 5, "time": 120},
            {"title": "Root", "cat": "Варгейм", "tags": ["Контроль территорий", "Фэнтези"], "diff": 4, "min": 2, "max": 4, "time": 90},
            {"title": "Blood Rage", "cat": "Варгейм", "tags": ["Контроль территорий", "Фэнтези", "Карточная"], "diff": 2, "min": 2, "max": 4, "time": 90},
            {"title": "Star Wars: Rebellion", "cat": "Варгейм", "tags": ["Космос", "На кубиках", "Для двоих"], "diff": 4, "min": 2, "max": 2, "time": 180},
            
            # Детективы и прочее
            {"title": "Sherlock Holmes CD", "cat": "Тематическая", "tags": ["Детектив", "Кооператив"], "diff": 2, "min": 1, "max": 8, "time": 90},
            {"title": "MicroMacro: Crime City", "cat": "Патигейм", "tags": ["Детектив", "Кооператив"], "diff": 1, "min": 1, "max": 4, "time": 30},
            {"title": "King of Tokyo", "cat": "Семейная", "tags": ["На кубиках", "Карточная"], "diff": 1, "min": 2, "max": 6, "time": 30},
        ]

        for item in games_data:
            # Создаем или получаем игру
            game, created = BoardGame.objects.get_or_create(
                title=item['title'],
                defaults={
                    'slug': slugify(item['title'], allow_unicode=True),
                    'description': f"Описание для игры {item['title']}. Очень крутая игра, всем советую!",
                    'category': categories[item['cat']],
                    'difficulty': item['diff'],
                    'min_players': item['min'],
                    'max_players': item['max'],
                    'play_time': item['time'],
                    'is_active': True
                }
            )
            
            # Добавляем теги
            if created:
                for tag_name in item['tags']:
                    if tag_name in tags:
                        game.tags.add(tags[tag_name])
                self.stdout.write(self.style.SUCCESS(f'Игра добавлена: {item["title"]}'))
            else:
                 self.stdout.write(f'Игра уже есть: {item["title"]}')
        
        self.stdout.write(self.style.SUCCESS('ВСЕ ГОТОВО! БАЗА ЗАПОЛНЕНА.'))