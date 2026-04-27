# backend/cms/views.py
import os
import json
from django.http import JsonResponse
from django.conf import settings

MESSAGES_DIR = os.path.join(settings.BASE_DIR.parent, 'frontend', 'messages')

def get_translations(request, locale):
    if locale not in ['ru', 'en']:
        return JsonResponse({'error': 'Unsupported locale'}, status=400)
        
    filepath = os.path.join(MESSAGES_DIR, f'{locale}.json')
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return JsonResponse(data)
    except FileNotFoundError:
        return JsonResponse({}, status=200) # Возвращаем пустой объект, если файла еще нет
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)