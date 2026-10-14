from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status as http_status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..models import ActivityEvent, Issue, IssueLabel, Project, Sprint
from ..schemas.issue import IssueCreate, IssueUpdate


VALID_STATUSES = {"Backlog", "To Do", "In Progress", "Done"}
VALID_PRIORITIES = {"Low", "Medium", "High", "Critical"}
VALID_TYPES = {"Bug", "Feature", "Task"}
VALID_SORT_FIELDS = {"created_at", "updated_at", "title", "priority", "status", "due_date"}


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def get_issue_or_404(db: Session, issue_id: int) -> Issue:
    issue = db.get(Issue, issue_id)
    if issue is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


def serialize_issue(issue: Issue) -> dict:
    return {
        "id": issue.id,
        "project_id": issue.project_id,
        "title": issue.title,
        "description": issue.description,
        "status": issue.status.value if hasattr(issue.status, "value") else issue.status,
        "priority": issue.priority.value if hasattr(issue.priority, "value") else issue.priority,
        "type": issue.type.value if hasattr(issue.type, "value") else issue.type,
        "assignee": issue.assignee,
        "labels": [label.label for label in issue.labels],
        "due_date": issue.due_date.isoformat() if issue.due_date else None,
        "sprint_id": issue.sprint_id,
        "created_at": issue.created_at,
        "updated_at": issue.updated_at,
        "closed_at": issue.closed_at,
    }


def get_sprint_or_404(db: Session, sprint_id: int) -> Sprint:
    sprint = db.get(Sprint, sprint_id)
    if sprint is None:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Sprint not found")
    return sprint


def record_activity(
    db: Session,
    project_id: int,
    event_type: str,
    message: str,
    *,
    issue_id: int | None = None,
    sprint_id: int | None = None,
    details: dict | None = None,
) -> None:
    db.add(
        ActivityEvent(
            project_id=project_id,
            issue_id=issue_id,
            sprint_id=sprint_id,
            event_type=event_type,
            message=message,
            details=details or {},
        )
    )
    db.commit()


def list_project_issues(
    db: Session,
    project_id: int,
    *,
    status: str | None = None,
    priority: str | None = None,
    assignee: str | None = None,
    label: str | None = None,
    q: str | None = None,
    sort: str = "updated_at",
    order: str = "desc",
    page: int = 1,
    page_size: int = 20,
) -> list[Issue]:
    if status and status not in VALID_STATUSES:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid status filter")
    if priority and priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid priority filter")
    if sort not in VALID_SORT_FIELDS:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid sort field")
    if order.lower() not in {"asc", "desc"}:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Order must be asc or desc")
    if page < 1:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Page must be >= 1")
    if page_size < 1 or page_size > 100:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="page_size must be between 1 and 100")

    query = select(Issue).where(Issue.project_id == project_id)
    if status:
        query = query.where(Issue.status == status)
    if priority:
        query = query.where(Issue.priority == priority)
    if assignee:
        query = query.where(Issue.assignee == assignee)
    if label:
        label_subquery = select(IssueLabel.issue_id).where(IssueLabel.label == label)
        query = query.where(Issue.id.in_(label_subquery))
    if q:
        term = f"%{q}%"
        query = query.where(or_(Issue.title.ilike(term), Issue.description.ilike(term), Issue.assignee.ilike(term)))

    sort_column = getattr(Issue, sort)
    query = query.order_by(sort_column.asc() if order.lower() == "asc" else sort_column.desc())
    offset = (page - 1) * page_size
    query = query.limit(page_size).offset(offset)
    return db.scalars(query).all()


def create_issue(db: Session, project_id: int, payload: IssueCreate) -> Issue:
    get_project_or_404(db, project_id)
    issue = Issue(
        project_id=project_id,
        title=payload.title,
        description=payload.description,
        status=payload.status,
        priority=payload.priority,
        type=payload.type,
        assignee=payload.assignee,
        due_date=payload.due_date,
    )
    db.add(issue)
    db.flush()

    for label in payload.labels:
        db.add(IssueLabel(issue_id=issue.id, label=label))

    db.commit()
    db.refresh(issue)
    record_activity(
        db,
        project_id,
        event_type="issue_created",
        message=f"Issue '{issue.title}' was created.",
        issue_id=issue.id,
        details={"status": issue.status.value, "priority": issue.priority.value},
    )
    return issue


def update_issue(db: Session, issue_id: int, payload: IssueUpdate) -> Issue:
    issue = get_issue_or_404(db, issue_id)
    old_status = issue.status
    old_sprint_id = issue.sprint_id
    if payload.title is not None:
        issue.title = payload.title
    if payload.description is not None:
        issue.description = payload.description
    if payload.status is not None:
        issue.status = payload.status
    if payload.priority is not None:
        issue.priority = payload.priority
    if payload.type is not None:
        issue.type = payload.type
    if payload.assignee is not None:
        issue.assignee = payload.assignee
    if payload.due_date is not None:
        issue.due_date = payload.due_date
    if payload.sprint_id is not None:
        issue.sprint_id = payload.sprint_id
    if payload.labels is not None:
        for existing in list(issue.labels):
            db.delete(existing)
        for label in payload.labels:
            db.add(IssueLabel(issue_id=issue.id, label=label))

    if issue.status == "Done" and old_status != "Done":
        issue.closed_at = datetime.utcnow()
    elif issue.status != "Done" and old_status == "Done":
        issue.closed_at = None

    db.commit()
    db.refresh(issue)

    if payload.status is not None and payload.status != old_status:
        record_activity(
            db,
            issue.project_id,
            event_type="issue_status_changed",
            message=f"Issue '{issue.title}' moved from {old_status} to {issue.status}.",
            issue_id=issue.id,
            details={"from": old_status, "to": issue.status},
        )
    elif payload.sprint_id is not None and payload.sprint_id != old_sprint_id:
        record_activity(
            db,
            issue.project_id,
            event_type="issue_sprint_changed",
            message=f"Issue '{issue.title}' was assigned to sprint #{payload.sprint_id}.",
            issue_id=issue.id,
            sprint_id=payload.sprint_id,
            details={"from_sprint_id": old_sprint_id, "to_sprint_id": payload.sprint_id},
        )
    else:
        record_activity(
            db,
            issue.project_id,
            event_type="issue_updated",
            message=f"Issue '{issue.title}' was updated.",
            issue_id=issue.id,
            details={"updated_fields": [key for key, value in payload.model_dump(exclude_none=True).items()]},
        )

    return issue


def delete_issue(db: Session, issue_id: int) -> None:
    issue = get_issue_or_404(db, issue_id)
    project_id = issue.project_id
    title = issue.title
    db.delete(issue)
    db.commit()
    record_activity(
        db,
        project_id,
        event_type="issue_deleted",
        message=f"Issue '{title}' was deleted.",
        details={"issue_id": issue_id},
    )
