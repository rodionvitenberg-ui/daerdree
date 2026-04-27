# backend/cms/models.py
from django.db import models

class SiteTranslation(models.Model):
    class Meta:
        managed = False # Django не будет создавать таблицу в БД
        verbose_name = 'Тексты сайта (JSON)'
        verbose_name_plural = 'Тексты сайта (JSON)'