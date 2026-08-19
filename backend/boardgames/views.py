import logging
from rest_framework import viewsets, filters, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils.translation import get_language
from django.http import Http404
from .models import BoardGame, Category, Tag
from .serializers import BoardGameSerializer, CategorySerializer, TagSerializer, GameMarqueeSerializer
from .filters import BoardGameFilter

logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class TagViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer


class BoardGameViewSet(viewsets.ReadOnlyModelViewSet):
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

    def get_object(self):
        """Безопасный поиск игры: логирует ошибку и возвращает 404 вместо 500."""
        try:
            queryset = self.filter_queryset(self.get_queryset())
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
            obj = queryset.get(**filter_kwargs)
            self.check_object_permissions(self.request, obj)
            return obj
        except BoardGame.DoesNotExist:
            raise Http404(f"Игра с ID {self.kwargs.get(lookup_url_kwarg, '?')} не найдена")
        except Exception as e:
            logger.error(f"Ошибка при поиске игры: {e}", exc_info=True)
            raise Http404("Игра не найдена из-за внутренней ошибки")

    def list(self, request, *args, **kwargs):
        """Безопасный list с обработкой ошибок."""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Ошибка при получении списка игр: {e}", exc_info=True)
            return Response(
                {"error": "Ошибка при загрузке игр"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def retrieve(self, request, *args, **kwargs):
        """Безопасный retrieve с обработкой ошибок сериализации."""
        try:
            return super().retrieve(request, *args, **kwargs)
        except Http404:
            raise
        except Exception as e:
            logger.error(f"Ошибка при загрузке игры {kwargs.get('pk', '?')}: {e}", exc_info=True)
            return Response(
                {"error": "Ошибка при загрузке игры"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def get_queryset(self):
        queryset = self.queryset.all()

        if self.action == 'list':
            lang = self.request.query_params.get('lang')
            if not lang:
                lang = get_language()

            if lang and lang.startswith('en'):
                queryset = queryset.filter(is_visible_en=True)
            else:
                queryset = queryset.filter(is_visible_ru=True)

        return queryset
