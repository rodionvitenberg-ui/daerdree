from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from staff.permissions import IsStaffUser
from .admin_serializers import EventAdminSerializer
from .models import Event


class AdminEventPagination(PageNumberPagination):
    page_size = 20


class EventAdminViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-event_date')
    serializer_class = EventAdminSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]
    pagination_class = AdminEventPagination
    parser_classes = [MultiPartParser, JSONParser]
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    filterset_fields = ['is_visible']
