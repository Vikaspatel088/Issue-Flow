from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import ActivityEvent, Issue, Project


def get_project_dashboard(db: Session, project_id: int) -> dict:
    project = db.get(Project, project_id)
    if project is None:
        raise ValueError("Project not found")
    issues = db.scalars(select(Issue).where(Issue.project_id == project_id)).all()
    total = len(issues)
    open_count = sum(1 for item in issues if item.status != "Done")
    done_count = sum(1 for item in issues if item.status == "Done")
    completion_percentage = round((done_count / total) * 100, 1) if total else 0.0

    by_status = {
        "Backlog": sum(1 for item in issues if item.status == "Backlog"),
        "To Do": sum(1 for item in issues if item.status == "To Do"),
        "In Progress": sum(1 for item in issues if item.status == "In Progress"),
        "Done": done_count,
    }
    by_priority = {
        "Low": sum(1 for item in issues if item.priority == "Low"),
        "Medium": sum(1 for item in issues if item.priority == "Medium"),
        "High": sum(1 for item in issues if item.priority == "High"),
        "Critical": sum(1 for item in issues if item.priority == "Critical"),
    }
    recent_activity = db.scalars(
        select(ActivityEvent)
        .where(ActivityEvent.project_id == project_id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(10)
    ).all()

    return {
        "project_id": project_id,
        "issue_count": total,
        "open_issue_count": open_count,
        "done_issue_count": done_count,
        "completion_percentage": completion_percentage,
        "by_status": by_status,
        "by_priority": by_priority,
        "recent_activity": [
            {
                "id": item.id,
                "event_type": item.event_type,
                "message": item.message,
                "created_at": item.created_at.isoformat(),
            }
            for item in recent_activity
        ],
    }


def get_project_analytics(db: Session, project_id: int) -> dict:
    project = db.get(Project, project_id)
    if project is None:
        raise ValueError("Project not found")

    issue_counts = {
        "Backlog": db.scalar(
            select(func.count()).select_from(Issue).where(Issue.project_id == project_id, Issue.status == "Backlog")
        )
        or 0,
        "To Do": db.scalar(
            select(func.count()).select_from(Issue).where(Issue.project_id == project_id, Issue.status == "To Do")
        )
        or 0,
        "In Progress": db.scalar(
            select(func.count()).select_from(Issue).where(Issue.project_id == project_id, Issue.status == "In Progress")
        )
        or 0,
        "Done": db.scalar(
            select(func.count()).select_from(Issue).where(Issue.project_id == project_id, Issue.status == "Done")
        )
        or 0,
    }
    issue_sequence = db.execute(
        select(ActivityEvent.event_type, ActivityEvent.created_at)
        .where(ActivityEvent.project_id == project_id)
        .order_by(ActivityEvent.created_at.asc())
    ).all()

    bucketed: dict[str, dict[str, int]] = defaultdict(lambda: {"created": 0, "closed": 0})
    for event_type, created_at in issue_sequence:
        date_key = created_at.date().isoformat()
        if event_type in {"issue_created", "issue_updated"}:
            bucketed[date_key]["created"] += 1
        if event_type in {"issue_status_changed", "issue_deleted"}:
            bucketed[date_key]["closed"] += 1

    series = [
        {"date": date_key, "created": values["created"], "closed": values["closed"]}
        for date_key, values in sorted(bucketed.items())
    ]

    return {
        "project_id": project_id,
        "issue_counts": issue_counts,
        "series": series,
        "generated_at": datetime.utcnow().isoformat(),
    }
