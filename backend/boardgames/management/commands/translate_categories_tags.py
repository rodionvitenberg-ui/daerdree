"""Перевод названий категорий и тегов: name_en (англ) + name_ru (русский)."""
import os; os.environ["DJANGO_ALLOW_ASYNC_UNSAFE"] = "true"

from django.core.management.base import BaseCommand
from boardgames.models import Category, Tag
from deep_translator import GoogleTranslator


def ru(text):
    """Перевод с английского на русский."""
    if not text or len(text.strip()) < 2:
        return text
    try:
        return GoogleTranslator(source="en", target="ru").translate(text[:2000]) or text
    except Exception:
        return text


class Command(BaseCommand):
    help = "Перевод Category.name и Tag.name на русский + заполнение name_en"

    def handle(self, *args, **kwargs):
        # === КАТЕГОРИИ ===
        for obj in Category.objects.all():
            eng = obj.name_en or obj.name_ru or obj.name
            if not eng:
                continue
            obj.name_en = eng
            obj.name_ru = ru(eng)
            obj.name = obj.name_ru  # name = name_ru (DEFAULT_LANGUAGE = ru)
            obj.save()
            self.stdout.write(f"  🏷️ {eng} → {obj.name_ru}")

        # === ТЕГИ ===
        for obj in Tag.objects.all():
            eng = obj.name_en or obj.name_ru or obj.name
            if not eng:
                continue
            obj.name_en = eng
            obj.name_ru = ru(eng)
            obj.name = obj.name_ru
            obj.save()
            self.stdout.write(f"  🏷️ {eng} → {obj.name_ru}")

        self.stdout.write(self.style.SUCCESS(f"\n✅ Категорий: {Category.objects.count()}, Тегов: {Tag.objects.count()}"))