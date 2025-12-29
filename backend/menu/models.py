from django.db import models

class MenuCategory(models.Model):
    """Категория меню (Пиво, Снэки, Горячее)"""
    name = models.CharField(max_length=100, verbose_name="Название")
    slug = models.SlugField(max_length=100, unique=True)
    # Порядок вывода (чтобы Пиво было первым, а чай последним)
    order = models.PositiveIntegerField(default=0, verbose_name="Порядок вывода")

    class Meta:
        verbose_name = "Категория меню"
        verbose_name_plural = "Категории меню"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    """Позиция в меню"""
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE, related_name='items', verbose_name="Категория")
    
    name = models.CharField(max_length=200, verbose_name="Название")
    slug = models.SlugField(max_length=200, unique=True)
    description = models.TextField(blank=True, verbose_name="Описание/Состав")
    
    image = models.ImageField(upload_to='menu/', blank=True, null=True, verbose_name="Фото")

    # ВАЖНО: DecimalField для цены
    # max_digits=6 -> до 9999.99
    # decimal_places=2 -> два знака после запятой
    price = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Цена")
    
    # Объем или вес (текстом, т.к. может быть "0.5 л", "300 г", "1 шт")
    volume = models.CharField(max_length=50, blank=True, verbose_name="Объем/Вес")

    # Флаги для фильтрации
    is_vegetarian = models.BooleanField(default=False, verbose_name="Вегетарианское?")
    is_available = models.BooleanField(default=True, verbose_name="В наличии?")

    class Meta:
        verbose_name = "Блюдо/Напиток"
        verbose_name_plural = "Блюда и Напитки"
        ordering = ['name']

    def __str__(self):
        return self.name