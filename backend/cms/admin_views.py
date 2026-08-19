from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from staff.permissions import IsStaffUser
from .json_i18n import grouped_payload, write_messages

class TranslationsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffUser]

    def get(self, request):
        return Response(grouped_payload())

    def put(self, request):
        keys = request.data.get('keys')
        if not isinstance(keys, dict):
            return Response({'detail': 'Ожидался объект keys.'}, status=status.HTTP_400_BAD_REQUEST)
        write_messages(keys)
        return Response(grouped_payload())
