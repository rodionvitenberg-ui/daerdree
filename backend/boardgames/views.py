from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import BoardGame, Category, Tag
from .serializers import BoardGameSerializer, CategorySerializer, TagSerializer, GameMarqueeSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer

class BoardGameViewSet(viewsets.ReadOnlyModelViewSet):
    # Оптимизация! select_related('category') и prefetch_related('tags')
    # заставляют Django забрать все данные ОДНИМ запросом к базе,
    # а не делать 100+1 запрос для каждой игры.
    queryset = BoardGame.objects.filter(is_active=True).select_related('category').prefetch_related('tags')
    serializer_class = BoardGameSerializer

    # Подключаем "батарейки" для поиска и фильтрации
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # По каким полям можно точно фильтровать? (например: ?difficulty=3)
    filterset_fields = ['category', 'difficulty', 'min_players', 'max_players']
    
    # Где искать текст? (например: ?search=Munchkin)
    search_fields = ['title', 'description']
    
    # Как можно сортировать? (например: ?ordering=price)
    ordering_fields = ['play_time', 'difficulty', 'created_at']

    def get_serializer_class(self):
        """Динамический выбор сериализатора"""
        if self.action == 'marquee':
            return GameMarqueeSerializer
        return BoardGameSerializer

    @action(detail=False, methods=['get'])
    def marquee(self, request):
        """
        GET /api/boardgames/marquee/
        Возвращает игры, у которых ЕСТЬ картинка.
        Можно добавить .order_by('?')[:20] чтобы брать случайные,
        или .order_by('-created_at')[:20] для новинок.
        """
        games = BoardGame.objects.filter(is_active=True).exclude(image='')
        # Если игр будет 1000, лучше ограничить слайсом [:20], чтобы не грузить DOM
        games = games[:20] 
        
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)