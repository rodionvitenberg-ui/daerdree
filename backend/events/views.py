from rest_framework import viewsets
from .models import Event
from .serializers import EventSerializer
from django.utils import timezone

class EventViewSet(viewsets.ModelViewSet):
    # Показываем только будущие события (или все, если хочешь историю)
    # Пока давай выводить все, отсортированные по дате
    queryset = Event.objects.filter(is_visible=True).order_by('event_date')
    serializer_class = EventSerializer