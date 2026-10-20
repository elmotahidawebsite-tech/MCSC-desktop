# CSC Backend

Django and Django REST Framework backend for the local Crime Scene Collector
desktop application.

## Local API access

Electron starts Django at `127.0.0.1:8000`. DRF API endpoints do not use JWT or
session authentication. A loopback-only permission restricts API calls to
local clients; this does not stop another program on the same Windows device
from accessing the API. Django Admin at `/admin/` continues to use its own
session login.

Cases, evidence, and sync records can be created without a user account.
Their user relationships are optional; existing relationships and user data
are preserved.

The default SQLite database is in `%LOCALAPPDATA%\\MCSC\\db.sqlite3` (or the
directory selected by `CSC_DATA_DIR`). The checked-in `db.sqlite3` is not
selected by default.

## Development

Install dependencies with `pip install -r requirements.txt`. Django's local
development server defaults to `127.0.0.1:8000`; Electron also binds it
explicitly to that address.

## API surface

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/users/` | loopback client |
| GET/POST | `/api/cases/` | loopback client |
| GET/PUT/PATCH/DELETE | `/api/cases/{id}/` | loopback client |
| GET/POST | `/api/cases/{case_id}/persons/` | loopback client |
| GET/POST | `/api/cases/{case_id}/evidence/` | loopback client |
| GET/POST | `/api/evidence/{evidence_id}/media/` | loopback client |
| GET/POST | `/api/cases/{case_id}/bodies/` | loopback client |
| GET/POST | `/api/cases/{case_id}/images/` | loopback client |
| POST | `/api/sync/` | loopback client |
| GET | `/api/sync/status/` | loopback client |

Case and media endpoints include related edit, delete, download, report, and
import actions as exposed in `cases/urls.py`.

## Project layout

```text
config/       project settings, root URLs, loopback API permission
users/        custom User model and explicit local Admin identity lookup
cases/        cases, people, evidence, media, reports, and sync API
```
