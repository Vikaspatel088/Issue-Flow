from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from sqlalchemy import Date, Enum as SAEnum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class SprintStatus(str, Enum):
    PLANNED = "Planned"
    CURRENT = "Current"
    UPCOMING = "Upcoming"
    COMPLETED = "Completed"


class Sprint(Base):
    __tablename__ = "sprints"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    goal: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[SprintStatus] = mapped_column(
        SAEnum(SprintStatus, values_callable=lambda enum_cls: [member.value for member in enum_cls]),
        nullable=False,
        default=SprintStatus.PLANNED,
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    project: Mapped["Project"] = relationship(back_populates="sprints")
    issues: Mapped[list["Issue"]] = relationship(back_populates="sprint", cascade="all, delete-orphan")
    activity_events: Mapped[list["ActivityEvent"]] = relationship(
        back_populates="sprint",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
