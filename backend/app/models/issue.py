from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class IssueStatus(str, Enum):
    BACKLOG = "Backlog"
    TO_DO = "To Do"
    IN_PROGRESS = "In Progress"
    DONE = "Done"


class IssuePriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class IssueType(str, Enum):
    BUG = "Bug"
    FEATURE = "Feature"
    TASK = "Task"


def _value_list(enum_cls):
    return [member.value for member in enum_cls]


class IssueLabel(Base):
    __tablename__ = "issue_labels"

    issue_id: Mapped[int] = mapped_column(ForeignKey("issues.id", ondelete="CASCADE"), primary_key=True)
    label: Mapped[str] = mapped_column(String(50), primary_key=True)

    issue: Mapped["Issue"] = relationship(back_populates="labels")


class Issue(Base):
    __tablename__ = "issues"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(5000), nullable=True)
    status: Mapped[IssueStatus] = mapped_column(
        SAEnum(IssueStatus, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
        default=IssueStatus.BACKLOG,
    )
    priority: Mapped[IssuePriority] = mapped_column(
        SAEnum(IssuePriority, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
        default=IssuePriority.MEDIUM,
    )
    type: Mapped[IssueType] = mapped_column(
        "issue_type",
        SAEnum(IssueType, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
        default=IssueType.TASK,
    )
    assignee: Mapped[str | None] = mapped_column(String(120), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    sprint_id: Mapped[int | None] = mapped_column(ForeignKey("sprints.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    closed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    project: Mapped["Project"] = relationship(back_populates="issues")
    sprint: Mapped["Sprint | None"] = relationship(back_populates="issues")
    labels: Mapped[list[IssueLabel]] = relationship(
        back_populates="issue",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    activity_events: Mapped[list["ActivityEvent"]] = relationship(
        back_populates="issue",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
