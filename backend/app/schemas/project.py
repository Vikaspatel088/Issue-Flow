from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: str | None = None
    repository_owner: str | None = Field(default=None, max_length=150)
    repository_name: str | None = Field(default=None, max_length=150)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    repository_owner: str | None = Field(default=None, max_length=150)
    repository_name: str | None = Field(default=None, max_length=150)


class ProjectRead(ProjectBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
