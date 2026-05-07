from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.translation import get_language
from .models import BoardGame, Category, Tag
from .serializers import BoardGameSerializer, CategorySerializer, TagSerializer, GameMarqueeSerializer
from .filters import BoardGameFilter

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class BoardGameViewSet(viewsets.ReadOnlyModelViewSet):
    # Оптимизированный базовый запрос
    queryset = BoardGame.objects.filter(is_active=True).prefetch_related('categories', 'tags', 'expansions')
    serializer_class = BoardGameSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BoardGameFilter
    search_fields = ['title', 'description']
    ordering_fields = ['play_time', 'difficulty', 'created_at']

    def get_serializer_class(self):
        if self.action == 'marquee':
            return GameMarqueeSerializer
        return BoardGameSerializer

    @action(detail=False, methods=['get'])
    def marquee(self, request):
        games = self.queryset.exclude(image='')
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)
    
    def get_queryset(self):
        # Берем базовый набор (уже отфильтрованный по is_active=True)
        queryset = self.queryset.all()
        
        # Применяем фильтры видимости ТОЛЬКО для списка (библиотеки)
        if self.action == 'list':
            lang = self.request.query_params.get('lang')
            if not lang:
                lang = get_language()
            
            if lang and lang.startswith('en'):
                queryset = queryset.filter(is_visible_en=True)
            else:
                queryset = queryset.filter(is_visible_ru=True)
        
        # Для действия 'retrieve' (открытие страницы игры по ID) 
        # мы возвращаем queryset без фильтра по языку.
        # Это позволит открыть игру по прямой ссылке, даже если её нет в списке этой локали.
        return queryset