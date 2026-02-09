from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from .models import Event
from .serializers import EventSerializer
from django.utils import timezone

# 1. Настраиваем "Разбиватель страниц"
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 9  # Отдаем по 9 событий за раз (красиво для сетки 3x3)
    page_size_query_param = 'page_size'
    max_page_size = 100

class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    pagination_class = StandardResultsSetPagination
    queryset = Event.objects.all()

    def get_queryset(self):
        return Event.objects.filter(
            is_visible=True,
            event_date__gte=timezone.now()
        ).order_by('event_date')