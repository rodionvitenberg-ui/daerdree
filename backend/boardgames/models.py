from django.db import models
from ckeditor.fields import RichTextField

class Category(models.Model):
    """Категория игры (Стратегия, Патигейм, Детская)"""
    name = models.CharField(max_length=100, verbose_name="Название категории")
    slug = models.SlugField(max_length=100, unique=True, verbose_name="URL Slug")
    icon = models.ImageField(upload_to='categories/', blank=True, null=True, verbose_name="Иконка")
    description = models.TextField(blank=True, verbose_name="Описание")

    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"

    def __str__(self):
        return self.name

class Tag(models.Model):
    """Механика или Тег (На кубиках, Кооператив, Для двоих)"""
    name = models.CharField(max_length=100, unique=True, verbose_name="Название")
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.FileField(upload_to='attribute_icons/', blank=True, null=True, verbose_name="Иконка (SVG/PNG)")

    class Meta:
        verbose_name = "Механика/Тег"
        verbose_name_plural = "Механики и Теги"

    def __str__(self):
        return self.name

class BoardGame(models.Model):
    """Основная карточка игры"""
    title = models.CharField(max_length=200, verbose_name="Название игры")
    slug = models.SlugField(max_length=200, unique=True)
    
    categories = models.ManyToManyField(Category, blank=True, related_name='games', verbose_name="Категории")
    tags = models.ManyToManyField(Tag, blank=True, verbose_name="Механики")

    description = RichTextField(verbose_name="Описание")

    # ДАННЫЕ С BGG
    designer = models.CharField(max_length=300, blank=True, verbose_name="Создатель")
    bgg_type = models.CharField(max_length=50, blank=True, default='boardgame', verbose_name="Тип игры (BGG)")

    # ИЗОБРАЖЕНИЯ
    image = models.ImageField(upload_to='games/', blank=True, null=True, verbose_name="Фото коробки")
    setup_image = models.ImageField(upload_to='games/setups/', blank=True, null=True, verbose_name="Фото расклада")

    min_players = models.PositiveIntegerField(verbose_name="Мин. игроков", default=2)
    max_players = models.PositiveIntegerField(verbose_name="Макс. игроков", default=4)
    play_time = models.PositiveIntegerField(verbose_name="Среднее время (мин)", help_text="Пример: 45")
    
    DIFFICULTY_CHOICES = [
        (1, 'Очень легко'),
        (2, 'Легко'),
        (3, 'Средне'),
        (4, 'Сложно'),
        (5, 'Хардкор'),
    ]
    difficulty = models.IntegerField(choices=DIFFICULTY_CHOICES, default=2, verbose_name="Сложность")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Добавлено")
    is_active = models.BooleanField(default=True, verbose_name="Показывать на сайте?")

    is_visible_ru = models.BooleanField(
        default=True, 
        verbose_name='Показывать на русском'
    )
    is_visible_en = models.BooleanField(
        default=False, # По умолчанию новые игры могут быть без английской версии
        verbose_name='Показывать на английском'
    )

    class Meta:
        verbose_name = "Настольная игра"
        verbose_name_plural = "Настольные игры"
        ordering = ['title']

    def __str__(self):
        return self.title

# НОВАЯ МОДЕЛЬ ДЛЯ ДОПОЛНЕНИЙ
class Expansion(models.Model):
    """Дополнение к настольной игре"""
    # related_name='expansions' позволит нам обращаться к дополнениям игры как game.expansions.all()
    game = models.ForeignKey(BoardGame, related_name='expansions', on_delete=models.CASCADE, verbose_name="Основная игра")
    title = models.CharField(max_length=200, verbose_name="Название дополнения")
    description = RichTextField(blank=True, verbose_name="Описание дополнения")

    class Meta:
        verbose_name = "Дополнение"
        verbose_name_plural = "Дополнения"

    def __str__(self):
        return self.title