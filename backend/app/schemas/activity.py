from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ActivityEventRead(BaseModel):
    id: int
    project_id: int
    issue_id: int | None = None
    sprint_id: int | None = None
    event_type: str
    message: str
    details: dict[str, Any] | None = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
