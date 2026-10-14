from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...services.dashboard_service import get_project_analytics, get_project_dashboard
from ..deps import get_db

router = APIRouter(tags=["dashboard"])


@router.get("/projects/{project_id}/dashboard")
def project_dashboard(project_id: int, db: Session = Depends(get_db)) -> dict:
    try:
        return get_project_dashboard(db, project_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/projects/{project_id}/analytics")
def project_analytics(project_id: int, db: Session = Depends(get_db)) -> dict:
    try:
        return get_project_analytics(db, project_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
