import time
import requests
import datetime
try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo # Для старых питонов

from dateparser.search import search_dates
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from events.models import Event

TELEGRAM_BOT_TOKEN = "8564013326:AAGBlMk4-eqlZq_9iTXVv2oIC-itKHsivho"
CYPRUS_TZ = ZoneInfo("Asia/Nicosia")  # Таймзона заведения

class Command(BaseCommand):
    help = 'Импорт с учетом Кипрского времени'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('🤖 Импорт: время трактуется как Asia/Nicosia.'))
        
        offset = 0
        imported_count = 0
        target_count = 15

        while imported_count < target_count:
            try:
                response = requests.get(
                    f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates",
                    params={"offset": offset, "timeout": 30}
                )
                data = response.json()

                if "result" in data:
                    for item in data["result"]:
                        offset = item["update_id"] + 1

                        if "message" not in item: continue
                        msg = item["message"]
                        if "photo" not in msg: continue

                        telegram_id = str(msg.get("forward_from_message_id", msg["message_id"]))
                        if Event.objects.filter(telegram_id=telegram_id).exists():
                            self.stdout.write(f'⚠️ Пост {telegram_id} уже есть.')
                            continue

                        caption = msg.get("caption", "") or "Без названия"
                        lines = caption.split('\n')
                        title = lines[0][:100]
                        description = "\n".join(lines[1:]) if len(lines) > 1 else caption

                        # 1. Дата публикации (конвертируем сразу в Кипрское время)
                        original_timestamp = msg.get("forward_date", msg["date"])
                        publish_dt_utc = datetime.datetime.fromtimestamp(original_timestamp, tz=datetime.timezone.utc)
                        publish_date_cyprus = publish_dt_utc.astimezone(CYPRUS_TZ)
                        
                        final_date_part = publish_date_cyprus.date()
                        final_time_part = None

                        # 2. Поиск в тексте
                        found_dates = search_dates(
                            caption, 
                            languages=['ru', 'en'], 
                            settings={'PREFER_DATES_FROM': 'future', 'RELATIVE_BASE': publish_date_cyprus}
                        )
                        
                        if found_dates:
                            for text_match, date_obj in found_dates:
                                # dateparser возвращает наивную дату или локальную.
                                # Если наивная - считаем, что она Кипрская
                                if date_obj.tzinfo is None:
                                    date_obj = date_obj.replace(tzinfo=CYPRUS_TZ)
                                else:
                                    date_obj = date_obj.astimezone(CYPRUS_TZ)
                                
                                if date_obj.date() != publish_date_cyprus.date():
                                    final_date_part = date_obj.date()
                                
                                if date_obj.time() != datetime.time(0, 0):
                                    final_time_part = date_obj.time()

                        # 3. Сборка
                        target_time = final_time_part if final_time_part else datetime.time(19, 0)
                        
                        # Собираем дату, зная, что это Кипрское время
                        final_date_cyprus = datetime.datetime.combine(final_date_part, target_time)
                        final_date_cyprus = final_date_cyprus.replace(tzinfo=CYPRUS_TZ)
                        
                        # Django хранит в UTC, конвертируем перед сохранением (автоматически или вручную)
                        # Но лучше передать aware object, Django сам разберется
                        
                        # ФОТО
                        best_photo = msg["photo"][-1]
                        file_id = best_photo["file_id"]
                        file_path = requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getFile?file_id={file_id}").json()["result"]["file_path"]
                        img_data = requests.get(f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}").content
                        
                        Event.objects.create(
                            telegram_id=telegram_id,
                            title=title,
                            description=description,
                            image=ContentFile(img_data, name=f"history_{telegram_id}.jpg"),
                            event_date=final_date_cyprus,
                            is_visible=True
                        )

                        imported_count += 1
                        self.stdout.write(self.style.SUCCESS(f'✅ ЗАПИСАНО (Cyprus Time): {final_date_cyprus.strftime("%d.%m %H:%M")}'))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Ошибка: {e}'))
                time.sleep(2)
            time.sleep(0.5)