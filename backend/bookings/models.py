from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
import requests
import os

# Твои токены (лучше вынести в .env, но пока можно и так для теста)
TELEGRAM_BOT_TOKEN = "8564013326:AAGBlMk4-eqlZq_9iTXVv2oIC-itKHsivho"
TELEGRAM_CHAT_ID = "6465575638"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На рассмотрении'),
        ('confirmed', 'Подтверждено'),
        ('rejected', 'Отклонено'),
    ]

    name = models.CharField(max_length=100, verbose_name="Имя гостя")
    contact = models.CharField(max_length=100, verbose_name="Телефон/Контакт")
    date = models.CharField(max_length=100, verbose_name="Дата и время") # Можно DateTimeField, но пока текстом проще с фронта
    guests = models.CharField(max_length=50, verbose_name="Кол-во гостей")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Статус")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")

    class Meta:
        verbose_name = "Бронь стола"
        verbose_name_plural = "Брони столов"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.date}"

# --- ЛОГИКА ОТПРАВКИ В TELEGRAM ---
@receiver(post_save, sender=Booking)
def send_telegram_notification(sender, instance, created, **kwargs):
    """
    Срабатывает автоматически после сохранения записи в базу.
    Если запись новая (created=True) -> шлем уведомление.
    """
    if created:
        message = (
            f"🔔 <b>Новая заявка на бронь!</b>\n\n"
            f"👤 <b>Имя:</b> {instance.name}\n"
            f"👥 <b>Гостей:</b> {instance.guests}\n"
            f"📅 <b>Дата:</b> {instance.date}\n"
            f"📞 <b>Контакт:</b> {instance.contact}\n\n"
            f"<i>Статус: На рассмотрении</i>"
        )
        
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML"
        }
        
        try:
            requests.post(url, json=data)
        except Exception as e:
            print(f"Ошибка отправки в Telegram: {e}")