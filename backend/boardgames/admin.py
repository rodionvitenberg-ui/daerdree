# backend/boardgames/admin.py

from django.contrib import admin
from django import forms
from ckeditor.widgets import CKEditorWidget
from modeltranslation.admin import TranslationAdmin, TranslationStackedInline
from .models import Category, Tag, BoardGame, Expansion

class BoardGameAdminForm(forms.ModelForm):
    class Meta:
        model = BoardGame
        fields = '__all__'
        widgets = {
            # Принудительно вешаем CKEditor на переведенные поля
            'description_ru': CKEditorWidget(),
            'description_en': CKEditorWidget(),
        }

class ExpansionAdminForm(forms.ModelForm):
    class Meta:
        model = Expansion
        fields = '__all__'
        widgets = {
            'description_ru': CKEditorWidget(),
            'description_en': CKEditorWidget(),
        }

@admin.register(Category)
class CategoryAdmin(TranslationAdmin): # Наследуем от TranslationAdmin
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Tag)
class TagAdmin(TranslationAdmin): # Наследуем от TranslationAdmin
    prepopulated_fields = {'slug': ('name',)}

# Используем TranslationStackedInline для перевода внутри инлайнов
class ExpansionInline(TranslationStackedInline): 
    form = ExpansionAdminForm
    model = Expansion
    extra = 1

@admin.register(BoardGame)
class BoardGameAdmin(TranslationAdmin):
    form = BoardGameAdminForm # Форма с CKEditor, которую мы сделали шагом ранее
    
    # 1. Добавляем новые функции в list_display
    list_display = (
        'title', 
        'get_categories', 
        'get_tags',         # <--- Вывод механик
        'get_expansions',   # <--- Вывод дополнений
        'difficulty', 
        'is_active', 
        'is_visible_ru', 
        'is_visible_en'
    )
    
    list_filter = ('categories', 'tags', 'difficulty', 'is_active') # Можно и фильтр по тегам добавить
    search_fields = ('title', 'description')
    
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ExpansionInline]

    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'description', 'categories', 'tags')
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

    # --- ФУНКЦИИ ДЛЯ КРАСИВОГО ВЫВОДА В ТАБЛИЦУ ---

    def get_categories(self, obj):
        categories = [c.name for c in obj.categories.all()]
        return ", ".join(categories) if categories else "—"
    get_categories.short_description = 'Категории'

    def get_tags(self, obj):
        tags = [t.name for t in obj.tags.all()]
        return ", ".join(tags) if tags else "—"
    get_tags.short_description = 'Механики'

    def get_expansions(self, obj):
        # Обращаемся к дополнениям через related_name='expansions', которое мы задали в models.py
        expansions = [e.title for e in obj.expansions.all()]
        return ", ".join(expansions) if expansions else "Нет"
    get_expansions.short_description = 'Дополнения'

    # --- ОПТИМИЗАЦИЯ БАЗЫ ДАННЫХ (ОЧЕНЬ ВАЖНО) ---
    # Без этого метода Django будет делать отдельный SQL-запрос для категорий, 
    # тегов и дополнений КАЖДОЙ игры в списке, что сильно замедлит загрузку страницы.
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Подгружаем все связанные объекты одним махом
        return qs.prefetch_related('categories', 'tags', 'expansions')