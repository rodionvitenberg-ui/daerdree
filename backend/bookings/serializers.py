from rest_framework import serializers
from .models import Booking

class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['id', 'name', 'contact', 'date', 'guests', 'event_title', 'status', 'created_at']
        read_only_fields = ['status', 'created_at'] # Статус меняет только менеджер