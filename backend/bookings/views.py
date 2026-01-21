from rest_framework import viewsets, mixins
from .models import Booking
from .serializers import BookingSerializer

class BookingViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Разрешаем только Создавать (Create) и Смотреть список (List) броней.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer