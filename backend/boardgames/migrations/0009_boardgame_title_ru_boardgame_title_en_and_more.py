"""
Добавляем translation-поля для BoardGame (title_ru, title_en, description_ru, description_en),
которые были удалены в 0004 и не восстановлены.
(Остальные модели уже имеют эти поля от 0005.)
"""

from django.db import migrations, models
import ckeditor.fields


class Migration(migrations.Migration):

    dependencies = [
        ('boardgames', '0008_gameimage'),
    ]

    operations = [
        migrations.AddField(
            model_name='boardgame',
            name='description_en',
            field=ckeditor.fields.RichTextField(null=True, blank=True, verbose_name='Описание (EN)'),
        ),
        migrations.AddField(
            model_name='boardgame',
            name='description_ru',
            field=ckeditor.fields.RichTextField(null=True, blank=True, verbose_name='Описание (RU)'),
        ),
        migrations.AddField(
            model_name='boardgame',
            name='title_en',
            field=models.CharField(max_length=200, null=True, blank=True, verbose_name='Название (EN)'),
        ),
        migrations.AddField(
            model_name='boardgame',
            name='title_ru',
            field=models.CharField(max_length=200, null=True, blank=True, verbose_name='Название (RU)'),
        ),
    ]