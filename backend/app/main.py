from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.activity import router as activity_router
from .api.routes.dashboard import router as dashboard_router
from .api.routes.issues import router as issues_router
from .api.routes.projects import router as projects_router
from .api.routes.sprints import router as sprints_router
from .config import settings

app = FastAPI(title="IssueFlow API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "issueflow", "environment": settings.APP_ENV}


app.include_router(projects_router, prefix="/api/v1")
app.include_router(issues_router, prefix="/api/v1")
app.include_router(sprints_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(activity_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
