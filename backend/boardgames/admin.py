# backend/boardgames/admin.py

from django.contrib import admin
# Добавляем TranslationStackedInline для дополнений
from modeltranslation.admin import TranslationAdmin, TranslationStackedInline
from .models import Category, Tag, BoardGame, Expansion

@admin.register(Category)
class CategoryAdmin(TranslationAdmin): # Наследуем от TranslationAdmin
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Tag)
class TagAdmin(TranslationAdmin): # Наследуем от TranslationAdmin
    prepopulated_fields = {'slug': ('name',)}

# Используем TranslationStackedInline для перевода внутри инлайнов
class ExpansionInline(TranslationStackedInline): 
    model = Expansion
    extra = 1

@admin.register(BoardGame)
class BoardGameAdmin(TranslationAdmin):
    list_display = ('title', 'category', 'min_players', 'max_players', 'difficulty', 'is_active', 'is_visible_ru', 'is_visible_en')
    list_filter = ('category', 'difficulty', 'is_active', 'is_visible_ru', 'is_visible_en')
    search_fields = ('title', 'description')
    
    prepopulated_fields = {'slug': ('title',)}
    
    inlines = [ExpansionInline]

    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'description', 'category', 'tags')
        }),
        ('Настройки игры', {
            'fields': ('min_players', 'max_players', 'play_time', 'difficulty')
        }),
        ('Изображения', {
            'fields': ('image', 'setup_image')
        }),
        ('Видимость на сайте', {
            'fields': ('is_active', 'is_visible_ru', 'is_visible_en'),
            'description': 'Отметьте, для каких языковых версий сайта доступна эта игра.'
        }),
    )