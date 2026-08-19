from django.http import Http404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from staff.permissions import IsStaffUser
from .admin_serializers import (
    BoardGameAdminSerializer,
    BoardGameListSerializer,
    CategoryAdminSerializer,
    GameImageAdminSerializer,
    TagAdminSerializer,
)
from .models import BoardGame, Category, GameImage, Tag


class CategoryAdminViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategoryAdminSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.games.exists():
            return Response(
                {'detail': 'Категория привязана к играм и не может быть удалена.'},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


class TagAdminViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all().order_by('name')
    serializer_class = TagAdminSerializer
    permission_classes = [IsAuthenticated, IsStaffUser]

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if obj.boardgame_set.exists():
            return Response(
                {'detail': 'Тег привязан к играм и не может быть удалён.'},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


class AdminGamePagination(PageNumberPagination):
    page_size = 50


class BoardGameAdminViewSet(viewsets.ModelViewSet):
    queryset = BoardGame.objects.all()
    permission_classes = [IsAuthenticated, IsStaffUser]
    pagination_class = AdminGamePagination
    filter_backends = [SearchFilter, DjangoFilterBackend]
    search_fields = ['title']
    filterset_fields = ['is_active', 'is_visible_ru', 'is_visible_en']

    def get_queryset(self):
        return BoardGame.objects.all().prefetch_related(
            'categories', 'tags', 'expansions', 'images'
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return BoardGameListSerializer
        return BoardGameAdminSerializer

    def _set_image_field(self, request, field_name):
        game = self.get_object()
        if request.method == 'DELETE':
            getattr(game, field_name).delete(save=True)
            return Response({field_name: None})
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'detail': 'Файл не передан.'}, status=status.HTTP_400_BAD_REQUEST)
        setattr(game, field_name, uploaded)
        game.save()
        file_field = getattr(game, field_name)
        url = request.build_absolute_uri(file_field.url) if file_field else None
        return Response({field_name: url})

    @action(detail=True, methods=['post', 'delete'], url_path='image', parser_classes=[MultiPartParser, FormParser])
    def cover_image(self, request, pk=None):
        return self._set_image_field(request, 'image')

    @action(detail=True, methods=['post', 'delete'], url_path='setup-image', parser_classes=[MultiPartParser, FormParser])
    def setup_image(self, request, pk=None):
        return self._set_image_field(request, 'setup_image')

    @action(detail=True, methods=['get', 'post'], url_path='gallery', parser_classes=[MultiPartParser, FormParser])
    def gallery(self, request, pk=None):
        game = self.get_object()
        if request.method == 'GET':
            serializer = GameImageAdminSerializer(
                game.images.all(), many=True, context={'request': request}
            )
            return Response(serializer.data)
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'detail': 'Файл не передан.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = GameImageAdminSerializer(
            data={
                'image_type': request.data.get('image_type', GameImage.ImageType.GALLERY),
                'order': request.data.get('order') or 0,
                'alt': request.data.get('alt', ''),
            },
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(game=game, image=uploaded)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GameGalleryItemView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get_object(self, game_id, image_id):
        try:
            image = GameImage.objects.get(pk=image_id)
        except GameImage.DoesNotExist:
            raise Http404
        if image.game_id != int(game_id):
            raise Http404
        return image

    def patch(self, request, game_id, image_id):
        image = self.get_object(game_id, image_id)
        serializer = GameImageAdminSerializer(
            image, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, game_id, image_id):
        image = self.get_object(game_id, image_id)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
