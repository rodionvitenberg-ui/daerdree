from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
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
    # Добавили 'expansions' в prefetch_related для оптимизации запросов к БД
    queryset = BoardGame.objects.filter(is_active=True).select_related('category').prefetch_related('tags', 'expansions')
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
        games = BoardGame.objects.filter(is_active=True).exclude(image='')
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)