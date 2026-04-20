from pydantic import BaseModel, Field
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: dict


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    definition: Optional[dict] = None


class WorkflowResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    version: str
    definition: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExecutionCreate(BaseModel):
    input_data: dict = {}


class ExecutionUpdate(BaseModel):
    status: Optional[str] = None
    output_data: Optional[dict] = None
    error: Optional[str] = None


class ExecutionResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    status: str
    input_data: Optional[dict]
    output_data: Optional[dict]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error: Optional[str]

    class Config:
        from_attributes = True


class ExecutionLogResponse(BaseModel):
    id: UUID
    execution_id: UUID
    agent_id: Optional[str]
    step: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True