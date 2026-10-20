"""
Desktop production entry point for CSC backend.
Uses Waitress instead of runserver, binds to 127.0.0.1 on a dynamic port.
"""
import os
import sys
from pathlib import Path

# إعداد Django قبل ما نستورد أي حاجة منه
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# تحديد منفذ التشغيل من environment variable
PORT = int(os.environ.get("MCSC_PORT", "8000"))
HOST = "127.0.0.1"

def main():
    # استيراد Django WSGI application
    from django.core.wsgi import get_wsgi_application
    application = get_wsgi_application()
    
    # استيراد waitress بعد ما Django يتعد
    from waitress import serve
    
    print(f"[CSC Backend] Starting on {HOST}:{PORT}", flush=True)
    
    try:
        serve(
            application,
            host=HOST,
            port=PORT,
            threads=8,
            _quiet=True,
        )
    except KeyboardInterrupt:
        print("[CSC Backend] Shutting down...", flush=True)
    except Exception as e:
        print(f"[CSC Backend] Fatal error: {e}", flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()