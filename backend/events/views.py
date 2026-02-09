from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from .models import Event
from .serializers import EventSerializer

# 1. Настраиваем "Разбиватель страниц"
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 9  # Отдаем по 9 событий за раз (красиво для сетки 3x3)
    page_size_query_param = 'page_size'
    max_page_size = 100

class EventViewSet(viewsets.ModelViewSet):
    # 2. Сортировка: '-event_date' означает "от новых к старым" (минус перед полем)
    queryset = Event.objects.filter(is_visible=True).order_by('-event_date')
    serializer_class = EventSerializer
    pagination_class = StandardResultsSetPagination