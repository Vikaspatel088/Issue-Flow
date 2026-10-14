from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...models import Issue, Sprint
from ...schemas.sprint import SprintCreate, SprintRead, SprintUpdate
from ...services.issue_service import get_project_or_404, get_sprint_or_404, record_activity
from ..deps import get_db

router = APIRouter(tags=["sprints"])


@router.get("/projects/{project_id}/sprints", response_model=list[SprintRead])
def list_project_sprints(project_id: int, db: Session = Depends(get_db)) -> list[Sprint]:
    get_project_or_404(db, project_id)
    return db.scalars(select(Sprint).where(Sprint.project_id == project_id).order_by(Sprint.start_date.asc())).all()


@router.post("/projects/{project_id}/sprints", response_model=SprintRead, status_code=status.HTTP_201_CREATED)
def create_project_sprint(project_id: int, payload: SprintCreate, db: Session = Depends(get_db)) -> Sprint:
    get_project_or_404(db, project_id)
    if payload.start_date > payload.end_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sprint start_date must be before end_date")
    sprint = Sprint(project_id=project_id, **payload.model_dump())
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    record_activity(
        db,
        project_id,
        event_type="sprint_created",
        message=f"Sprint '{sprint.name}' was created.",
        sprint_id=sprint.id,
        details={"start_date": str(sprint.start_date), "end_date": str(sprint.end_date)},
    )
    return sprint


@router.get("/sprints/{sprint_id}", response_model=SprintRead)
def read_sprint(sprint_id: int, db: Session = Depends(get_db)) -> Sprint:
    return get_sprint_or_404(db, sprint_id)


@router.patch("/sprints/{sprint_id}", response_model=SprintRead)
def patch_sprint(sprint_id: int, payload: SprintUpdate, db: Session = Depends(get_db)) -> Sprint:
    sprint = get_sprint_or_404(db, sprint_id)
    updates = payload.model_dump(exclude_unset=True)
    if "start_date" in updates and updates["start_date"] is not None and "end_date" in updates and updates["end_date"] is not None:
        if updates["start_date"] > updates["end_date"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sprint start_date must be before end_date")
    if "start_date" in updates and updates["start_date"] is not None and sprint.end_date < updates["start_date"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sprint start_date must be before end_date")
    if "end_date" in updates and updates["end_date"] is not None and sprint.start_date > updates["end_date"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sprint start_date must be before end_date")
    for key, value in updates.items():
        setattr(sprint, key, value)
    db.commit()
    db.refresh(sprint)
    record_activity(
        db,
        sprint.project_id,
        event_type="sprint_updated",
        message=f"Sprint '{sprint.name}' was updated.",
        sprint_id=sprint.id,
        details={"updated_fields": list(updates.keys())},
    )
    return sprint


@router.delete("/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_sprint(sprint_id: int, db: Session = Depends(get_db)) -> Response:
    sprint = get_sprint_or_404(db, sprint_id)
    for issue in db.scalars(select(Issue).where(Issue.sprint_id == sprint_id)).all():
        issue.sprint_id = None

    record_activity(
        db,
        sprint.project_id,
        event_type="sprint_deleted",
        message=f"Sprint '{sprint.name}' was deleted.",
        sprint_id=sprint.id,
        details={"project_id": sprint.project_id},
    )
    db.delete(sprint)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
