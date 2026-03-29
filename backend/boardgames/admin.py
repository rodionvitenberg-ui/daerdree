from django.contrib import admin
from .models import Category, Tag, BoardGame, Expansion

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}

# Создаем Inline-класс для дополнений
class ExpansionInline(admin.StackedInline):
    model = Expansion
    extra = 1  # Количество пустых форм для новых дополнений по умолчанию

@admin.register(BoardGame)
class BoardGameAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'min_players', 'max_players', 'difficulty', 'is_active')
    list_filter = ('category', 'difficulty', 'is_active')
    search_fields = ('title',)
    prepopulated_fields = {'slug': ('title',)}
    
    # Добавляем инлайн в админку игры
    inlines = [ExpansionInline]