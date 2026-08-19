from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from .models import Event
from .serializers import EventSerializer


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'page_size'
    max_page_size = 100


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.filter(is_visible=True).order_by('-event_date')
    serializer_class = EventSerializer
    pagination_class = StandardResultsSetPagination
