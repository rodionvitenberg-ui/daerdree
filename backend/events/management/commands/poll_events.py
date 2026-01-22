import time
import requests
import datetime
import traceback
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

from dateparser.search import search_dates
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from events.models import Event

# Твой токен
TELEGRAM_BOT_TOKEN = "8564013326:AAGBlMk4-eqlZq_9iTXVv2oIC-itKHsivho"
CYPRUS_TZ = ZoneInfo("Asia/Nicosia")

class Command(BaseCommand):
    help = 'Daemon: Слушает новые посты и создает ивенты (v3.0 - Smart Merge + Cyprus TZ)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🤖 Бот-слушатель запущен. Ожидание постов...'))
        
        # Начинаем с 0, но лучше бы хранить offset в базе/файле. 
        # API Телеграм сам хранит очередь недолго, так что ок.
        offset = 0
        
        while True:
            try:
                response = requests.get(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates",
                    params={"offset": offset, "timeout": 30} # Long polling (ждет 30 сек)
                )
                
                # Если сети нет или таймаут - просто повторим
                if response.status_code != 200:
                    time.sleep(5)
                    continue

                data = response.json()

                if "result" in data:
                    for item in data["result"]:
                        offset = item["update_id"] + 1
                        
                        # Нас интересуют channel_post (посты в канале)
                        if "channel_post" not in item:
                            continue
                            
                        post = item["channel_post"]
                        
                        # Игнорируем посты без фото (обычно это просто болтовня)
                        if "photo" not in post:
                            continue

                        # --- 1. ПРОВЕРКА ДУБЛИКАТОВ ---
                        post_id = str(post["message_id"])
                        if Event.objects.filter(telegram_id=post_id).exists():
                            # Уже есть - пропускаем молча
                            continue

                        self.stdout.write(f"📨 Новый пост обнаружен! ID: {post_id}")

                        # --- 2. АНАЛИЗ ТЕКСТА ---
                        caption = post.get("caption", "") or post.get("text", "")
                        lines = caption.split('\n')
                        title = lines[0][:100] if lines else "Новое событие"
                        description = "\n".join(lines[1:]) if len(lines) > 1 else caption

                        # --- 3. ДАТА (КИПРСКОЕ ВРЕМЯ) ---
                        # А. Дата публикации
                        publish_ts = post.get("date")
                        publish_dt_utc = datetime.datetime.fromtimestamp(publish_ts, tz=datetime.timezone.utc)
                        publish_date_cyprus = publish_dt_utc.astimezone(CYPRUS_TZ)

                        final_date_part = publish_date_cyprus.date()
                        final_time_part = None

                        # Б. Поиск в тексте
                        found_dates = search_dates(
                            caption, 
                            languages=['ru', 'en'], 
                            settings={'PREFER_DATES_FROM': 'future', 'RELATIVE_BASE': publish_date_cyprus}
                        )

                        date_source = "публикация"
                        if found_dates:
                            for text_match, date_obj in found_dates:
                                # Приводим к Кипру
                                if date_obj.tzinfo is None:
                                    date_obj = date_obj.replace(tzinfo=CYPRUS_TZ)
                                else:
                                    date_obj = date_obj.astimezone(CYPRUS_TZ)
                                
                                # Если день отличается от даты поста -> это дата ивента
                                if date_obj.date() != publish_date_cyprus.date():
                                    final_date_part = date_obj.date()
                                
                                # Если время не 00:00 -> это время ивента
                                if date_obj.time() != datetime.time(0, 0):
                                    final_time_part = date_obj.time()
                            
                            date_source = "текст (merged)"

                        # В. Сборка
                        target_time = final_time_part if final_time_part else datetime.time(19, 0)
                        final_date_cyprus = datetime.datetime.combine(final_date_part, target_time)
                        final_date_cyprus = final_date_cyprus.replace(tzinfo=CYPRUS_TZ)

                        # --- 4. СКАЧИВАНИЕ ФОТО ---
                        best_photo = post["photo"][-1]
                        file_id = best_photo["file_id"]
                        
                        f_info = requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getFile?file_id={file_id}").json()
                        if "result" in f_info:
                            file_path = f_info["result"]["file_path"]
                            img_data = requests.get(f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}").content
                            photo_file = ContentFile(img_data, name=f"{post_id}.jpg")
                        else:
                            photo_file = None # Вряд ли, но вдруг

                        # --- 5. СОХРАНЕНИЕ ---
                        if photo_file:
                            Event.objects.create(
                                telegram_id=post_id,
                                title=title,
                                description=description,
                                image=photo_file,
                                event_date=final_date_cyprus,
                                is_visible=True
                            )
                            self.stdout.write(self.style.SUCCESS(f"✅ Событие '{title}' создано! Дата: {final_date_cyprus}"))
            
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"⚠️ Ошибка в цикле бота: {e}"))
                # Пишем трейсбек в лог, чтобы понять причину
                traceback.print_exc()
                time.sleep(5)
            
            # Небольшая пауза между запросами (хотя long polling сам держит паузу)
            time.sleep(1)