from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    message = 'Недостаточно прав.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return bool(request.user.is_staff and request.user.is_active)
