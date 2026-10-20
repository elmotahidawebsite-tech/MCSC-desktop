from rest_framework.views import APIView
from rest_framework.response import Response

from .models import User
from .serializers import UserSerializer
from config.permissions import LocalDesktopOnly


class UserListView(APIView):
    """قائمة المحطات (قراءة فقط) — للداشبورد وفلتر المحطات.
    الإدارة (إضافة/إيقاف/تفعيل/حذف) بتتم من Django Admin بس."""
    permission_classes = [LocalDesktopOnly]

    def get(self, request):
        qs = User.objects.filter(role=User.Role.OFFICER).order_by("username")
        return Response(UserSerializer(qs, many=True).data)