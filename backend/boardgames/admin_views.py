from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from staff.permissions import IsStaffUser
from .models import Category, Tag
from .admin_serializers import CategoryAdminSerializer, TagAdminSerializer


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
