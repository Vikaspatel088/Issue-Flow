from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class SprintBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    goal: str | None = None
    start_date: date
    end_date: date
    status: str = "Planned"


class SprintCreate(SprintBase):
    pass


class SprintUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    goal: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None


class SprintRead(SprintBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
