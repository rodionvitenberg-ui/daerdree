from rest_framework import serializers
from .models import Event


class EventAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'title_en',
            'description_en',
            'image',
            'event_date',
            'is_visible',
            'telegram_id',
            'created_at',
        ]
        extra_kwargs = {
            'telegram_id': {'read_only': True},
            'created_at': {'read_only': True},
            'title_en': {'required': False, 'allow_blank': True, 'allow_null': True},
            'description_en': {'required': False, 'allow_blank': True, 'allow_null': True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance is not None:
            self.fields['image'].required = False
