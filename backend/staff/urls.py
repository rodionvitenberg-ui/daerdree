from django.urls import path
from rest_framework.permissions import IsAuthenticated
from rest_framework.routers import DefaultRouter
from .permissions import IsStaffUser
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

class StaffRouter(DefaultRouter):
    def get_api_root_view(self, *args, **kwargs):
        view = super().get_api_root_view(*args, **kwargs)
        view.cls.permission_classes = [IsAuthenticated, IsStaffUser]
        return view


router = StaffRouter()
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

