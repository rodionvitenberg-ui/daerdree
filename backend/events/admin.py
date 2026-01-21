from django.contrib import admin
from .models import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_date', 'is_visible', 'telegram_id')
    list_filter = ('event_date', 'is_visible')