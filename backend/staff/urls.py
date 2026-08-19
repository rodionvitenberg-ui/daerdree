from django.urls import path
from rest_framework.routers import DefaultRouter
from cms.admin_views import TranslationsView
from boardgames.admin_views import (
    BoardGameAdminViewSet,
    CategoryAdminViewSet,
    GameGalleryItemView,
    TagAdminViewSet,
)
from events.admin_views import EventAdminViewSet
from bookings.admin_views import BookingAdminViewSet
from .views import CsrfView, LoginView, LogoutView, MeView, StatsView

router = DefaultRouter()
router.register(r'categories', CategoryAdminViewSet)
router.register(r'tags', TagAdminViewSet)
router.register(r'games', BoardGameAdminViewSet, basename='admin-game')
router.register(r'events', EventAdminViewSet, basename='admin-event')
router.register(r'bookings', BookingAdminViewSet, basename='admin-booking')

urlpatterns = [
    path('csrf/', CsrfView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('me/', MeView.as_view()),
    path('stats/', StatsView.as_view()),
    path('translations/', TranslationsView.as_view()),
    path(
        'games/<int:game_id>/gallery/<int:image_id>/',
        GameGalleryItemView.as_view(),
        name='admin-game-gallery-item',
    ),
]
urlpatterns += router.urls

