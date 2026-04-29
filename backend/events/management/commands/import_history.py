import time
import requests
from django.core.management.base import BaseCommand
from bookings.views import process_event_from_channel  # Берем логику парсинга из вьюшки!

TELEGRAM_BOT_TOKEN = "8564013326:AAGBlMk4-eqlZq_9iTXVv2oIC-itKHsivho"
WEBHOOK_URL = "https://daerdree.bar/api/webhook/telegram/" # Твой рабочий URL

class Command(BaseCommand):
    help = 'Синхронизация пропущенных постов с временным отключением Webhook'

    def handle(self, *args, **kwargs):
        self.stdout.write('🤖 Начинаем синхронизацию. Временно отключаем Webhook...')
        
        # 1. Отключаем вебхук, чтобы разблокировать метод getUpdates
        requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/deleteWebhook")
        time.sleep(2) # Даем серверам Telegram пару секунд, чтобы осознать изменение
        
        offset = 0
        imported_count = 0
        
        try:
            # 2. Запрашиваем очередь пропущенных сообщений
            response = requests.get(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates",
                params={"offset": offset, "timeout": 5}
            )
            data = response.json()

            if data.get("ok") and data.get("result"):
                for item in data["result"]:
                    # Сдвигаем offset, чтобы не читать одно сообщение дважды
                    offset = item["update_id"] + 1
                    
                    if "channel_post" in item:
                        # Парсим пост через нашу готовую функцию
                        process_event_from_channel(item["channel_post"])
                        imported_count += 1
                        self.stdout.write(f'✅ Обработан пост ID: {item["channel_post"].get("message_id")}')

            # 3. Подтверждаем Телеграму, что мы всё прочитали (очищаем очередь)
            if imported_count > 0:
                requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getUpdates", params={"offset": offset})

        except Exception as e:
            self.stdout.write(f'❌ Ошибка при импорте: {e}')
        
        finally:
            # 4. ВОЗВРАЩАЕМ ВЕБХУК НА МЕСТО
            self.stdout.write('Восстанавливаем Webhook...')
            req = requests.get(f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url={WEBHOOK_URL}")
            
            if req.json().get("ok"):
                self.stdout.write(self.style.SUCCESS(f'🎉 Готово! Обработано пропущенных постов: {imported_count}. Вебхук снова активен.'))
            else:
                self.stdout.write(self.style.ERROR('⚠️ Ошибка возврата вебхука! Проверь настройки Telegram.'))