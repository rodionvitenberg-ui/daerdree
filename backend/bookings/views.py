import json
import requests
import datetime
import traceback
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.base import ContentFile
from rest_framework import viewsets, mixins
from rest_framework.permissions import AllowAny

try:
    from zoneinfo import ZoneInfo
except ImportError:
    from backports.zoneinfo import ZoneInfo

from dateparser.search import search_dates

from .models import Booking, TELEGRAM_BOT_TOKEN
from .serializers import BookingSerializer
from events.models import Event  # Импортируем модель событий

CYPRUS_TZ = ZoneInfo("Asia/Nicosia")

class BookingViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Разрешаем только Создавать (Create) и Смотреть список (List) броней.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    
    authentication_classes = [] # Отключает проверку сессий и CSRF для этого эндпоинта
    permission_classes = [AllowAny] # Разрешает POST-запросы всем (включая Next.js сервер)

def process_event_from_channel(post):
    """
    Парсит пост из канала (или пересланный пост) и создает событие в БД.
    """
    if "photo" not in post:
        return # Игнорируем посты без фото

    # Учитываем, что сообщение может быть пересланным
    post_id = str(post.get("forward_from_message_id", post["message_id"]))
    
    # 1. Проверка дубликатов
    if Event.objects.filter(telegram_id=post_id).exists():
        return

    # 2. Анализ текста
    caption = post.get("caption", "") or post.get("text", "")
    lines = caption.split('\n')
    title = lines[0][:100] if lines else "Новое событие"
    description = "\n".join(lines[1:]) if len(lines) > 1 else caption

    # 3. Работа с датами (Кипрское время)
    # Берем дату оригинала, если пост переслан
    publish_ts = post.get("forward_date", post["date"])
    publish_dt_utc = datetime.datetime.fromtimestamp(publish_ts, tz=datetime.timezone.utc)
    publish_date_cyprus = publish_dt_utc.astimezone(CYPRUS_TZ)

    final_date_part = publish_date_cyprus.date()
    final_time_part = None

    found_dates = search_dates(
        caption, 
        languages=['ru', 'en'], 
        settings={'PREFER_DATES_FROM': 'future', 'RELATIVE_BASE': publish_date_cyprus}
    )

    if found_dates:
        for text_match, date_obj in found_dates:
            if date_obj.tzinfo is None:
                date_obj = date_obj.replace(tzinfo=CYPRUS_TZ)
            else:
                date_obj = date_obj.astimezone(CYPRUS_TZ)
            
            if date_obj.date() != publish_date_cyprus.date():
                final_date_part = date_obj.date()
            
            if date_obj.time() != datetime.time(0, 0):
                final_time_part = date_obj.time()

    target_time = final_time_part if final_time_part else datetime.time(19, 0)
    final_date_cyprus = datetime.datetime.combine(final_date_part, target_time)
    final_date_cyprus = final_date_cyprus.replace(tzinfo=CYPRUS_TZ)

    # 4. Скачивание фото
    best_photo = post["photo"][-1]
    file_id = best_photo["file_id"]
    
    f_info = requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getFile?file_id={file_id}").json()
    if "result" in f_info:
        file_path = f_info["result"]["file_path"]
        img_data = requests.get(f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}").content
        photo_file = ContentFile(img_data, name=f"event_{post_id}.jpg")
    else:
        photo_file = None

    # 5. Сохранение
    if photo_file:
        Event.objects.create(
            telegram_id=post_id,
            title=title,
            description=description,
            image=photo_file,
            event_date=final_date_cyprus,
            is_visible=True
        )

@csrf_exempt
def telegram_webhook(request):
    """
    Единый эндпоинт для обработки событий от Telegram (кнопки и посты из канала).
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # СЦЕНАРИЙ 1: Ловим нажатия на инлайн-кнопки (Бронирования)
            if 'callback_query' in data:
                query = data['callback_query']
                callback_data = query['data'] 
                chat_id = query['message']['chat']['id']
                message_id = query['message']['message_id']
                
                action, booking_id = callback_data.split('_')
                booking = Booking.objects.get(id=booking_id)
                
                # Меняем статус в базе
                if action == 'confirm':
                    booking.status = 'confirmed'
                    status_text = "🟢 Подтверждено"
                elif action == 'reject':
                    booking.status = 'rejected'
                    status_text = "🔴 Отклонено"
                    
                booking.save() 

                # Формируем обновленный текст сообщения
                event_line = f"🎉 <b>Событие:</b> {booking.event_title}\n" if booking.event_title else ""
                new_text = (
                    f"🔔 <b>Заявка обработана (ID: {booking.id})</b>\n\n"
                    f"{event_line}"
                    f"👤 <b>Имя:</b> {booking.name}\n"
                    f"👥 <b>Гостей:</b> {booking.guests}\n"
                    f"📅 <b>Дата:</b> {booking.date}\n"
                    f"📞 <b>Контакт:</b> {booking.contact}\n\n"
                    f"<i>Статус: {status_text}</i>"
                )
                
                # API Telegram для редактирования сообщения (убираем кнопки и меняем текст)
                edit_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/editMessageText"
                requests.post(edit_url, json={
                    "chat_id": chat_id,
                    "message_id": message_id,
                    "text": new_text,
                    "parse_mode": "HTML"
                })

            # СЦЕНАРИЙ 2: Ловим новые посты из канала (Афиша)
            elif 'channel_post' in data:
                process_event_from_channel(data['channel_post'])
                
            # СЦЕНАРИЙ 3: Ловим ОТРЕДАКТИРОВАННЫЕ старые посты 
            elif 'edited_channel_post' in data:
                process_event_from_channel(data['edited_channel_post'])
                
            # СЦЕНАРИЙ 4: ПЕРЕСЛАННЫЕ ПОСТЫ В ЛИЧКУ (МАССОВЫЙ ИМПОРТ)
            elif 'message' in data:
                msg = data['message']
                # Если нам переслали сообщение, и оно из канала — парсим!
                if msg.get('forward_from_chat') and msg['forward_from_chat'].get('type') == 'channel':
                    process_event_from_channel(msg)

            return JsonResponse({"status": "ok"})
            
        # === ВОТ ЭТИХ СТРОК НЕ ХВАТАЛО ===
        except Exception as e:
            traceback.print_exc()
            print(f"Webhook error: {e}")
            return JsonResponse({"status": "error"}, status=400)
    
    return JsonResponse({"status": "Method not allowed"}, status=405)