from django.db import models

class Category(models.Model):
    """Категория игры (Стратегия, Патигейм, Детская)"""
    name = models.CharField(max_length=100, verbose_name="Название категории")
    # Slug - это часть URL. Например: site.com/games/strategy
    slug = models.SlugField(max_length=100, unique=True, verbose_name="URL Slug")
    
    # icon заменяем на ImageField, так как это именно картинка
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
    
    # Связи
    # ForeignKey - у игры ОДНА категория (обычно). Если удалят категорию - удалится поле (null=True защитит игру от удаления)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, verbose_name="Категория")
    # ManyToMany - у игры может быть МНОГО механик, и у механики МНОГО игр
    tags = models.ManyToManyField(Tag, blank=True, verbose_name="Механики")

    description = models.TextField(verbose_name="Описание")
    image = models.ImageField(upload_to='games/', blank=True, null=True, verbose_name="Фото коробки")

    # ТЕ САМЫЕ ХАРДКОДНЫЕ ПОЛЯ (для фильтров)
    min_players = models.PositiveIntegerField(verbose_name="Мин. игроков", default=2)
    max_players = models.PositiveIntegerField(verbose_name="Макс. игроков", default=4)
    
    # Время в минутах (удобнее сортировать, чем строку "30-60 мин")
    play_time = models.PositiveIntegerField(verbose_name="Среднее время (мин)", help_text="Пример: 45")
    
    # Сложность от 1 до 5
    DIFFICULTY_CHOICES = [
        (1, 'Очень легко'),
        (2, 'Легко'),
        (3, 'Средне'),
        (4, 'Сложно'),
        (5, 'Хардкор'),
    ]
    difficulty = models.IntegerField(choices=DIFFICULTY_CHOICES, default=2, verbose_name="Сложность")

    # Системные поля
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Добавлено")
    is_active = models.BooleanField(default=True, verbose_name="Показывать на сайте?")

    class Meta:
        verbose_name = "Настольная игра"
        verbose_name_plural = "Настольные игры"
        ordering = ['title']

    def __str__(self):
        return self.title