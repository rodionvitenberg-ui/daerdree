import json
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, mixins

from .models import Booking, TELEGRAM_BOT_TOKEN
from .serializers import BookingSerializer

# === ВАШ ТЕКУЩИЙ КОД (ОСТАВЛЯЕМ) ===
class BookingViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Разрешаем только Создавать (Create) и Смотреть список (List) броней.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

# === НОВЫЙ КОД (ДЛЯ КНОПОК В TELEGRAM) ===
@csrf_exempt
def telegram_webhook(request):
    """
    Эндпоинт для обработки нажатий на инлайн-кнопки в Telegram.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Ловим нажатия на инлайн-кнопки
            if 'callback_query' in data:
                query = data['callback_query']
                callback_data = query['data'] # Это наша строка 'confirm_ID' или 'reject_ID'
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
                    
                booking.save() # Сохраняем новый статус

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

            return JsonResponse({"status": "ok"})
        except Exception as e:
            print(f"Webhook error: {e}")
            return JsonResponse({"status": "error"}, status=400)
    
    return JsonResponse({"status": "Method not allowed"}, status=405)