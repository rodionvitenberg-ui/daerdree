from django.contrib import admin
from django.urls import path
from django.http import HttpResponseRedirect
from django.core.management import call_command
from django.contrib import messages
import io

from deep_translator import GoogleTranslator # Подключаем переводчик

from .models import Event

# === НАША ФУНКЦИЯ ДЛЯ МАССОВОГО ПЕРЕВОДА ===
@admin.action(description='🇬🇧 Автоперевод выбранных событий (на Английский)')
def translate_to_english(modeladmin, request, queryset):
    translated_count = 0
    for event in queryset:
        try:
            # Переводим только если поля пустые (чтобы не затереть ручные правки, если ты их сделаешь)
            if not event.title_en and event.title:
                event.title_en = GoogleTranslator(source='ru', target='en').translate(event.title)
            
            if not event.description_en and event.description:
                event.description_en = GoogleTranslator(source='ru', target='en').translate(event.description)
            
            event.save()
            translated_count += 1
        except Exception as e:
            modeladmin.message_user(request, f"Ошибка перевода для '{event.title}': {e}", level=messages.ERROR)
            
    modeladmin.message_user(request, f"Успешно переведено событий: {translated_count}!", level=messages.SUCCESS)
# ==========================================

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_date', 'is_visible', 'telegram_id')
    list_filter = ('is_visible', 'event_date')
    search_fields = ('title', 'description')
    
    # 1. Подключаем наш экшен
    actions = [translate_to_english]
    
    # 2. Подключаем кастомный шаблон с кнопкой импорта
    change_list_template = "admin/events/event/change_list.html"

    # 3. Добавляем URL для кнопки импорта
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('import-telegram/', self.admin_site.admin_view(self.import_telegram_view), name='import_telegram_events'),
        ]
        return custom_urls + urls

    # 4. Логика при нажатии кнопки импорта
    def import_telegram_view(self, request):
        out = io.StringIO()
        try:
            call_command('import_history', stdout=out)
            output_log = out.getvalue()
            self.message_user(request, f"Импорт завершен. Лог: {output_log[:200]}...", level=messages.SUCCESS)
        except Exception as e:
            self.message_user(request, f"Ошибка импорта: {str(e)}", level=messages.ERROR)
        return HttpResponseRedirect("../")