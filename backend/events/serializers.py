from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'title_en', 'description', 'description_en', 'image', 'event_date', 'created_at']