import time
import requests
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils import timezone
from datetime import datetime
from events.models import Event

# Твой токен
TELEGRAM_BOT_TOKEN = "8564013326:AAGBlMk4-eqlZq_9iTXVv2oIC-itKHsivho"

class Command(BaseCommand):
    help = 'Импортирует пересланные сообщения как события (для старых постов)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🤖 Режим импорта истории активирован.'))
        self.stdout.write(self.style.WARNING('Перешли боту 3 поста из канала, и я добавлю их в базу.'))

        offset = 0
        imported_count = 0
        target_count = 3  # Сколько постов хотим импортировать

        while imported_count < target_count:
            try:
                # Получаем обновления
                response = requests.get(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates",
                    params={"offset": offset, "timeout": 30}
                )
                data = response.json()

                if "result" in data:
                    for item in data["result"]:
                        offset = item["update_id"] + 1

                        # Логика: нам нужны ОБЫЧНЫЕ сообщения (message), так как это пересылка в личку
                        # Но они должны быть forwarded (иметь forward_from_chat или forward_date)
                        if "message" not in item:
                            continue

                        msg = item["message"]
                        
                        # Проверяем, есть ли фото (афиша без фото не нужна)
                        if "photo" not in msg:
                            self.stdout.write(self.style.WARNING('⚠️ Сообщение без фото пропущено.'))
                            continue

                        # --- ПАРСИНГ ---
                        
                        # 1. ID поста (Используем forward_from_message_id если есть, иначе уникальный ID сообщения)
                        telegram_id = str(msg.get("forward_from_message_id", msg["message_id"]))

                        # Проверка на дубликаты
                        if Event.objects.filter(telegram_id=telegram_id).exists():
                            self.stdout.write(self.style.WARNING(f'⚠️ Пост {telegram_id} уже есть в базе.'))
                            continue

                        # 2. Текст
                        caption = msg.get("caption", "")
                        if not caption:
                            caption = "Без названия"

                        lines = caption.split('\n')
                        title = lines[0][:100] # Первая строка - заголовок
                        description = "\n".join(lines[1:]) if len(lines) > 1 else caption

                        # 3. Дата
                        # Пытаемся взять дату оригинальной публикации
                        timestamp = msg.get("forward_date", msg["date"])
                        event_date = datetime.fromtimestamp(timestamp, tz=timezone.utc)

                        # 4. Фото
                        best_photo = msg["photo"][-1]
                        file_id = best_photo["file_id"]
                        
                        file_info = requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getFile?file_id={file_id}").json()
                        file_path = file_info["result"]["file_path"]
                        img_data = requests.get(f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}").content
                        
                        photo_name = f"history_{telegram_id}.jpg"

                        # --- СОХРАНЕНИЕ ---
                        Event.objects.create(
                            telegram_id=telegram_id,
                            title=title,
                            description=description,
                            image=ContentFile(img_data, name=photo_name),
                            event_date=event_date,
                            is_visible=True
                        )

                        imported_count += 1
                        self.stdout.write(self.style.SUCCESS(f'✅ [{imported_count}/{target_count}] Импортировано: {title}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Ошибка: {e}'))
                time.sleep(2)
            
            time.sleep(1)

        self.stdout.write(self.style.SUCCESS('🎉 Готово! 3 события успешно импортированы.'))