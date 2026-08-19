# backend/cms/admin.py
import os
import json
from django.contrib import admin
from django.shortcuts import render, redirect
from django.contrib import messages
from .models import SiteTranslation
from .json_i18n import flatten_json, unflatten_json, LANGUAGES, get_messages_dir

@admin.register(SiteTranslation)
class SiteTranslationAdmin(admin.ModelAdmin):
    def has_module_permission(self, request): return True
    def has_view_permission(self, request, obj=None): return True
    def has_change_permission(self, request, obj=None): return True
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False

    def changelist_view(self, request, extra_context=None):
        # --- ОБРАБОТКА СОХРАНЕНИЯ (POST) ---
        if request.method == 'POST':
            new_data = {lang: {} for lang in LANGUAGES}
            
            # Собираем данные из формы
            for key, value in request.POST.items():
                if key.startswith('ru_') or key.startswith('en_'):
                    lang, json_key = key.split('_', 1)
                    if lang in LANGUAGES:
                        new_data[lang][json_key] = value

            # Восстанавливаем вложенность и сохраняем в файлы
            messages_dir = get_messages_dir()
            for lang in LANGUAGES:
                unflattened = unflatten_json(new_data[lang])
                filepath = os.path.join(messages_dir, f'{lang}.json')
                
                # Создаем папку/файлы, если их еще нет
                os.makedirs(messages_dir, exist_ok=True)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(unflattened, f, ensure_ascii=False, indent=2)
            
            messages.success(request, 'Переводы успешно обновлены и сохранены в JSON!')
            return redirect(request.path)

        # --- ЧТЕНИЕ ДАННЫХ ДЛЯ ОТОБРАЖЕНИЯ (GET) ---
        flat_data = {lang: {} for lang in LANGUAGES}
        all_keys = set()

        for lang in LANGUAGES:
            filepath = os.path.join(get_messages_dir(), f'{lang}.json')
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    try:
                        flat = flatten_json(json.load(f))
                        flat_data[lang] = flat
                        all_keys.update(flat.keys())
                    except Exception:
                        pass

        grouped_data = {}
        for key in sorted(list(all_keys)):
            parts = key.split(".", 1) 
            group_name = parts[0] if len(parts) > 1 else "Общие"
            display_key = parts[1] if len(parts) > 1 else key

            if group_name not in grouped_data:
                grouped_data[group_name] = []
                
            grouped_data[group_name].append({
                'full_key': key,
                'display_key': display_key,
                'ru': flat_data['ru'].get(key, ''),
                'en': flat_data['en'].get(key, ''),
            })

        context = {
            **self.admin_site.each_context(request),
            'title': 'Управление контентом сайта (JSON)',
            'grouped_data': grouped_data,
        }
        return render(request, 'admin/cms/sitetranslation/change_list.html', context)