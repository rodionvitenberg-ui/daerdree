from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from .permissions import IsStaffUser


def user_payload(user):
    return {'id': user.id, 'username': user.username, 'is_staff': user.is_staff}


class CsrfView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({'detail': 'ok'})


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'detail': 'Неверный логин или пароль.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_staff or not user.is_active:
            return Response({'detail': 'Недостаточно прав.'}, status=status.HTTP_403_FORBIDDEN)
        login(request, user)
        return Response(user_payload(user))


class LogoutView(APIView):
    permission_classes = [IsStaffUser]

    def post(self, request):
        logout(request)
        return Response({'detail': 'ok'})


class MeView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        return Response(user_payload(request.user))


class StatsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        from boardgames.models import BoardGame
        from events.models import Event
        from bookings.models import Booking
        return Response({
            'games': BoardGame.objects.count(),
            'events': Event.objects.count(),
            'bookings_pending': Booking.objects.filter(status='pending').count(),
        })
