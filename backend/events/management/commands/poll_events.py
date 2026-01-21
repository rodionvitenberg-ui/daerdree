import time
import requests
import datetime
import dateparser  # <--- Импортируем магию
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.utils import timezone
from events.models import Event

# Твой токен
TELEGRAM_BOT_TOKEN = "8564013326:AAGBlMk4-eqlZq_9iTXVv2oIC-itKHsivho"

class Command(BaseCommand):
    help = 'Запускает бота-слушателя с умным распознаванием дат'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🤖 Бот V 2.0 (Smart Date) запущен...'))
        
        offset = 0
        
        while True:
            try:
                response = requests.get(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates",
                    params={"offset": offset, "timeout": 30}
                )
                data = response.json()

                if "result" in data:
                    for item in data["result"]:
                        offset = item["update_id"] + 1
                        
                        if "channel_post" not in item:
                            continue
                            
                        post = item["channel_post"]
                        post_id = str(post["message_id"])
                        
                        if Event.objects.filter(telegram_id=post_id).exists():
                            continue

                        # --- ТЕКСТ ---
                        caption = post.get("caption", "") or post.get("text", "") # text для обычных сообщений, caption для фото
                        if not caption:
                            continue

                        lines = caption.split('\n')
                        title = lines[0][:100]
                        description = "\n".join(lines[1:]) if len(lines) > 1 else caption

                        # --- УМНЫЙ ПАРСИНГ ДАТЫ ---
                        # 1. Берем дату публикации поста как дефолт
                        publish_timestamp = post.get("date")
                        final_date = datetime.datetime.fromtimestamp(publish_timestamp, tz=datetime.timezone.utc)

                        # 2. Пытаемся найти дату в тексте (смотрим первые 3 строки, там обычно анонс)
                        text_to_analyze = "\n".join(lines[:3]) 
                        
                        # Настройки парсера:
                        # PREFER_DATES_FROM = 'future' (если написано "в субботу", значит в будущую)
                        # LANGUAGES = ['ru']
                        parsed_date = dateparser.parse(
                            text_to_analyze, 
                            languages=['ru', 'en'], 
                            settings={'PREFER_DATES_FROM': 'future', 'DATE_ORDER': 'DMY'}
                        )

                        if parsed_date:
                            # dateparser возвращает наивный datetime (без зоны), добавим UTC
                            if parsed_date.tzinfo is None:
                                final_date = parsed_date.replace(tzinfo=datetime.timezone.utc)
                            else:
                                final_date = parsed_date
                            
                            self.stdout.write(f"📅 Распознана дата из текста: {final_date}")
                        else:
                            self.stdout.write(f"🕒 Дата не найдена в тексте, используем время поста.")

                        # --- ФОТО ---
                        photo_file = None
                        if "photo" in post:
                            best_photo = post["photo"][-1]
                            file_id = best_photo["file_id"]
                            file_path = requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getFile?file_id={file_id}").json()["result"]["file_path"]
                            img_data = requests.get(f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}").content
                            photo_name = f"{post_id}.jpg"
                            photo_file = ContentFile(img_data, name=photo_name)

                        # --- СОХРАНЕНИЕ ---
                        # Сохраняем только если есть фото (или убери это условие, если нужны текстовые анонсы)
                        if photo_file: 
                            Event.objects.create(
                                telegram_id=post_id,
                                title=title,
                                description=description,
                                image=photo_file,
                                event_date=final_date,
                                is_visible=True
                            )
                            self.stdout.write(self.style.SUCCESS(f'✅ Сохранено: {title}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Ошибка: {e}'))
                time.sleep(5)
            
            time.sleep(1)