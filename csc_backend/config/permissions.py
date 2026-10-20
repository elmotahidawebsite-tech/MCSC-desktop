import ipaddress

from rest_framework.permissions import BasePermission


class LocalDesktopOnly(BasePermission):
    message = "The CSC API is available only to local clients."

    def has_permission(self, request, view):
        remote_addr = request.META.get("REMOTE_ADDR", "")
        try:
            return ipaddress.ip_address(remote_addr).is_loopback
        except ValueError:
            return False
