from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Импортируем наши Views
from boardgames.views import BoardGameViewSet, CategoryViewSet, TagViewSet
from menu.views import MenuViewSet

# Создаем роутер и регистрируем в нем наши "магазины"
router = DefaultRouter()
router.register(r'games', BoardGameViewSet)      # будет доступно по /api/games/
router.register(r'categories', CategoryViewSet)  # /api/categories/
router.register(r'tags', TagViewSet)             # /api/tags/
router.register(r'menu', MenuViewSet)            # /api/menu/

urlpatterns = [
    path('admin/', admin.site.urls),
    # Подключаем все маршруты роутера под префиксом 'api/'
    path('api/', include(router.urls)),
]

# ЭТО ВАЖНО:
# Чтобы Django умел отдавать картинки в режиме разработки (DEBUG=True),
# нужно добавить эту магическую строчку. Иначе картинки будут 404.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)