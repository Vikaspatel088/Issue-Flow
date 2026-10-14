from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...models import ActivityEvent
from ...schemas.activity import ActivityEventRead
from ...services.issue_service import get_project_or_404
from ..deps import get_db

router = APIRouter(tags=["activity"])


@router.get("/projects/{project_id}/activity", response_model=list[ActivityEventRead])
def get_project_activity(
    project_id: int,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[ActivityEvent]:
    get_project_or_404(db, project_id)
    offset = (page - 1) * page_size
    return db.scalars(
        select(ActivityEvent)
        .where(ActivityEvent.project_id == project_id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(page_size)
        .offset(offset)
    ).all()
