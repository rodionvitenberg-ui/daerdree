from django.urls import path
from cms.admin_views import TranslationsView
from .views import CsrfView, LoginView, LogoutView, MeView

urlpatterns = [
    path('csrf/', CsrfView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('me/', MeView.as_view()),
    path('translations/', TranslationsView.as_view()),
]
