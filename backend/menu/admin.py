from django.contrib import admin
from .models import MenuCategory, MenuItem

@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'order')
    list_editable = ('order',)  # Позволяет менять порядок прямо в списке, не заходя внутрь
    prepopulated_fields = {'slug': ('name',)}

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_available')
    list_filter = ('category', 'is_available', 'is_vegetarian')
    search_fields = ('name', 'description')
    list_editable = ('is_available', 'price') # Родители смогут быстро менять цену или скрывать блюдо
    prepopulated_fields = {'slug': ('name',)}