from rest_framework import viewsets
from .models import MenuCategory
from .serializers import MenuCategorySerializer

class MenuViewSet(viewsets.ReadOnlyModelViewSet):
    # Берем категории, сразу подгружаем их items (блюда), 
    # но только те, у которых is_available=True (хитрый фильтр внутри префетча пока опустим для простоты,
    # но prefetch_related('items') обязателен).
    queryset = MenuCategory.objects.all().prefetch_related('items')
    serializer_class = MenuCategorySerializer
    
    # Меню обычно маленькое, поиск и фильтры тут особо не нужны,
    # фронтенд сам отфильтрует JSON.