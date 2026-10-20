from pathlib import Path

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.http import JsonResponse, FileResponse, HttpResponseNotFound


def health_check(request):
    return JsonResponse({"status": "ok"})


FRONTEND_DIST = Path(settings.FRONTEND_DIST).resolve()


def spa_fallback(request, url_path=""):
    # لو المسار ملف (فيه نقطة في اسمه) → قدّمه من مجلد الـ build
    if url_path and "." in Path(url_path).name:
        candidate = (FRONTEND_DIST / url_path).resolve()
        if candidate.is_file() and str(candidate).startswith(str(FRONTEND_DIST)):
            return FileResponse(candidate.open("rb"))
        return HttpResponseNotFound("Static file not found.")

    # غير كده → رجّع index.html عشان React Router يشتغل
    index = FRONTEND_DIST / "index.html"
    if index.is_file():
        return FileResponse(index.open("rb"), content_type="text/html")
    return HttpResponseNotFound(
        "Frontend build not found. Run: npm run build inside csc_frontend"
    )


urlpatterns = [
    path("health/", health_check),
    path("admin/", admin.site.urls),
    path("api/", include("users.urls")),
    path("api/", include("cases.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    re_path(r"^(?P<url_path>.*)$", spa_fallback),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)