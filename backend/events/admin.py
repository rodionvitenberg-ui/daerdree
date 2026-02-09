from django.contrib import admin
from django.urls import path
from django.http import HttpResponseRedirect
from django.core.management import call_command
from django.contrib import messages
from django.utils.html import format_html
from django.urls import reverse
import io

from .models import Event

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'event_date', 'is_visible', 'telegram_id')
    list_filter = ('is_visible', 'event_date')
    search_fields = ('title', 'description')
    
    # 1. Подключаем кастомный шаблон (создадим его на Шаге 3)
    change_list_template = "admin/events/event/change_list.html"

    # 2. Добавляем URL для нашей кнопки
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('import-telegram/', self.admin_site.admin_view(self.import_telegram_view), name='import_telegram_events'),
        ]
        return custom_urls + urls

    # 3. Логика при нажатии кнопки
    def import_telegram_view(self, request):
        # Создаем буфер для перехвата того, что скрипт пишет в консоль (print/stdout)
        out = io.StringIO()
        
        try:
            # Вызываем твою команду как функцию
            call_command('import_history', stdout=out)
            
            # Получаем текст логов
            output_log = out.getvalue()
            
            # Показываем сообщение об успехе в админке
            self.message_user(request, f"Импорт завершен. Лог: {output_log[:200]}...", level=messages.SUCCESS)
            
        except Exception as e:
            self.message_user(request, f"Ошибка импорта: {str(e)}", level=messages.ERROR)

        # Возвращаем пользователя обратно на список событий
        return HttpResponseRedirect("../")