from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from staff.permissions import IsStaffUser
from .admin_serializers import BookingAdminSerializer
from .models import Booking


class AdminBookingPagination(PageNumberPagination):
    page_size = 20


class BookingAdminViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Booking.objects.all().order_by('-created_at')
    serializer_class = BookingAdminSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]
    pagination_class = AdminBookingPagination
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'contact']
    filterset_fields = ['status']
