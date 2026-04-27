# backend/cms/urls.py
from django.urls import path
from .views import get_translations

urlpatterns = [
    path('translations/<str:locale>/', get_translations, name='get_translations'),
]