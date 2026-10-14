from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from ...models import Issue
from ...schemas.issue import IssueCreate, IssueRead, IssueUpdate
from ...services.issue_service import (
    create_issue,
    delete_issue,
    get_issue_or_404,
    get_project_or_404,
    list_project_issues,
    serialize_issue,
    update_issue,
)
from ..deps import get_db

router = APIRouter(tags=["issues"])


@router.get("/projects/{project_id}/issues", response_model=list[IssueRead])
def read_project_issues(
    project_id: int,
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    assignee: str | None = Query(default=None),
    label: str | None = Query(default=None),
    q: str | None = Query(default=None),
    sort: str = Query(default="updated_at"),
    order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[Issue]:
    get_project_or_404(db, project_id)
    items = list_project_issues(
        db,
        project_id,
        status=status,
        priority=priority,
        assignee=assignee,
        label=label,
        q=q,
        sort=sort,
        order=order,
        page=page,
        page_size=page_size,
    )
    return [serialize_issue(item) for item in items]


@router.post("/projects/{project_id}/issues", response_model=IssueRead, status_code=status.HTTP_201_CREATED)
def create_project_issue(
    project_id: int,
    payload: IssueCreate,
    db: Session = Depends(get_db),
) -> dict:
    issue = create_issue(db, project_id, payload)
    return serialize_issue(issue)


@router.get("/issues/{issue_id}", response_model=IssueRead)
def read_issue(issue_id: int, db: Session = Depends(get_db)) -> dict:
    issue = get_issue_or_404(db, issue_id)
    return serialize_issue(issue)


@router.patch("/issues/{issue_id}", response_model=IssueRead)
def patch_issue(issue_id: int, payload: IssueUpdate, db: Session = Depends(get_db)) -> dict:
    issue = update_issue(db, issue_id, payload)
    return serialize_issue(issue)


@router.delete("/issues/{issue_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
def delete_issue_route(issue_id: int, db: Session = Depends(get_db)) -> Response:
    delete_issue(db, issue_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
