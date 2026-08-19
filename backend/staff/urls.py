from django.urls import path
from rest_framework.routers import DefaultRouter
from cms.admin_views import TranslationsView
from boardgames.admin_views import (
    BoardGameAdminViewSet,
    CategoryAdminViewSet,
    GameGalleryItemView,
    TagAdminViewSet,
)
from .views import CsrfView, LoginView, LogoutView, MeView

router = DefaultRouter()
router.register(r'categories', CategoryAdminViewSet)
router.register(r'tags', TagAdminViewSet)
router.register(r'games', BoardGameAdminViewSet, basename='admin-game')

urlpatterns = [
    path('csrf/', CsrfView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('me/', MeView.as_view()),
    path('translations/', TranslationsView.as_view()),
    path(
        'games/<int:game_id>/gallery/<int:image_id>/',
        GameGalleryItemView.as_view(),
        name='admin-game-gallery-item',
    ),
]
urlpatterns += router.urls

