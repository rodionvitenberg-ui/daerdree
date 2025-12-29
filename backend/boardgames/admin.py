from django.contrib import admin
from .models import Category, Tag, BoardGame

# Это делает красивую админку с автоматическим заполнением slug (URL) из названия
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    prepopulated_fields = {'slug': ('name',)}

@admin.register(BoardGame)
class BoardGameAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'min_players', 'max_players', 'difficulty', 'is_active')
    list_filter = ('category', 'difficulty', 'is_active')
    search_fields = ('title',)
    prepopulated_fields = {'slug': ('title',)}