from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

IssueStatus = str
IssuePriority = str
IssueType = str


class IssueBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    status: IssueStatus = "Backlog"
    priority: IssuePriority = "Medium"
    type: IssueType = "Task"
    assignee: str | None = None
    labels: list[str] = Field(default_factory=list)
    due_date: date | None = None


class IssueCreate(IssueBase):
    pass


class IssueUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: IssueStatus | None = None
    priority: IssuePriority | None = None
    type: IssueType | None = None
    assignee: str | None = None
    labels: list[str] | None = None
    due_date: date | None = None
    sprint_id: int | None = None


class IssueRead(IssueBase):
    id: int
    project_id: int
    sprint_id: int | None = None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
