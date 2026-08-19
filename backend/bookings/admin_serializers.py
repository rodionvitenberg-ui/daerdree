from rest_framework import serializers
from .models import Booking


class BookingAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'id',
            'name',
            'contact',
            'date',
            'guests',
            'event_title',
            'status',
            'created_at',
        ]
        extra_kwargs = {
            'created_at': {'read_only': True},
            'event_title': {'required': False, 'allow_blank': True, 'allow_null': True},
            'status': {'required': False},
        }
