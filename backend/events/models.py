from django.db import models

class Event(models.Model):
    # Чтобы не дублировать посты, если бот сойдет с ума
    telegram_id = models.CharField(max_length=50, unique=True, null=True, blank=True, verbose_name="ID поста в Telegram")
    
    title = models.CharField(max_length=200, verbose_name="Заголовок (авто или вручную)")
    description = models.TextField(verbose_name="Описание события")
    image = models.ImageField(upload_to='events/', verbose_name="Афиша")
    
    title_en = models.CharField(max_length=200, null=True, blank=True, verbose_name="Заголовок (EN)")
    description_en = models.TextField(null=True, blank=True, verbose_name="Описание (EN)")
    event_date = models.DateTimeField(verbose_name="Дата и время начала")
    
    is_visible = models.BooleanField(default=True, verbose_name="Показывать на сайте")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Событие/Афиша"
        verbose_name_plural = "Афиша"
        ordering = ['-event_date']

    def __str__(self):
        return f"{self.title} ({self.event_date.strftime('%d.%m %H:%M')})"