# CSC Desktop Frontend

React + Vite + TypeScript + Tailwind, wired to the csc_backend API. Matches
the local desktop workflow: Admin dashboard, cases, evidence, and media.

## Setup

```bash
npm install
cp .env.example .env    # points to http://127.0.0.1:8000/api by default
npm run dev
```

Runs at `http://localhost:5173/`.

## Local API identity

The React app opens at the Admin dashboard without an application login.
The API accepts requests only from loopback clients and does not use JWT or
session authentication. This does not prevent other programs on the same
Windows device from calling the API.

Case/evidence creation and sync do not require a user account. Their user
relationships are optional, and existing user data and relationships are
preserved.

## Main routes

- `/` — Admin dashboard
- `/admin/cases` — case list, filtering, and reports
- `/admin/cases/:id` — case details and related records

## Existing capabilities

- Criminal, civil, and body-case workflows
- Evidence, people, and media uploads
- Report and case export endpoints
