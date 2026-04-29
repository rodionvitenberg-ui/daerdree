from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

# Импортируем BookingViewSet и нашу новую функцию telegram_webhook
from bookings.views import BookingViewSet, telegram_webhook 
from events.views import EventViewSet

# Импортируем наши Views
from boardgames.views import BoardGameViewSet, CategoryViewSet, TagViewSet
from menu.views import MenuViewSet

# Создаем роутер и регистрируем в нем наши "магазины"
router = DefaultRouter()
router.register(r'games', BoardGameViewSet)      
router.register(r'categories', CategoryViewSet)  
router.register(r'tags', TagViewSet)             
router.register(r'menu', MenuViewSet)
router.register(r'bookings', BookingViewSet)
router.register(r'events', EventViewSet)         

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # === НАШ НОВЫЙ ВЕБХУК ===
    # Важно: прописываем его отдельным путем.
    # Теперь Telegram будет стучаться на https://daerdree.bar/api/webhook/telegram/
    path('api/webhook/telegram/', telegram_webhook, name='telegram_webhook'),
    
    # Подключаем все маршруты роутера под префиксом 'api/'
    path('api/', include(router.urls)),
    path('cms/', include('cms.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)