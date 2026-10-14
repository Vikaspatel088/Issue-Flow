# IssueFlow

IssueFlow is a full-stack issue and sprint management dashboard. The React interface provides project selection, issue lists, a Kanban board, sprint views, analytics, and settings. Its FastAPI backend stores projects, issues, sprints, labels, and activity events in PostgreSQL.

## Features

- Project-scoped issue and sprint CRUD with filtering and dashboard/analytics endpoints.
- Kanban status updates and activity history.
- PostgreSQL persistence managed by Alembic migrations.
- Explicit demo data for local UI inspection when the API is unreachable. Demo changes stay in browser local storage and are not sent to the backend.
- GitHub repository authentication and synchronization are not implemented; repository metadata is user-entered project data.

## Stack and layout

- Frontend: React, TypeScript, Vite, React Router, Tailwind CSS, Recharts.
- Backend: Python, FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL (`psycopg`).
- `src/`: frontend application, pages, API client, and local state.
- `backend/app/`: API routes, models, schemas, and services.
- `backend/alembic/`: database migration environment and revisions.
- `backend/tests/`: API tests.

## Prerequisites

- Node.js and npm.
- Python 3.10 or newer (the backend uses Python 3.10 union type syntax).
- PostgreSQL and a database created for IssueFlow.

## Configure and run

From the repository root, install dependencies:

```bash
npm install
python -m pip install -r backend/requirements.txt
```

Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL credentials. The example contains placeholders only. The backend reads this file from the repository root.

```env
APP_ENV=development
DATABASE_URL=postgresql+psycopg://<user>:<password>@localhost:5432/issueflow
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SECRET_KEY=replace-for-your-environment
```

Apply migrations and start the API from the repository root:

```bash
python -m alembic -c backend/alembic.ini upgrade head
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal, start the frontend:

```bash
npm run dev
```

The API health endpoint is `/api/v1/health`; interactive API documentation is available at `/docs` while the backend is running. Set `VITE_API_BASE_URL` at frontend build/dev time to override the default `http://localhost:8000/api/v1` API base URL.

## Verification commands

```bash
npm run build
python -m pytest -q backend/tests/test_api.py
```

Tests use a local SQLite test database by default. PostgreSQL integration and persistence checks should use a dedicated test database; never point a destructive test at a database with user data. Apply migrations with the command above and inspect the API using the health endpoint and `/docs`.

## Current limitations

- Live PostgreSQL and browser end-to-end verification depend on the local services and browser automation available in the environment.
- The app has demo-mode local browser data for inspection; it is not synchronized with backend projects.
- There is no GitHub OAuth, repository API integration, deployment configuration, or hosted demo URL.
