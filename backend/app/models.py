from pydantic import BaseModel, Field
from typing import Optional, Any, Literal
from uuid import UUID
from datetime import datetime


class ToolDefinition(BaseModel):
    name: str
    description: Optional[str] = None


class AgentDefinition(BaseModel):
    id: str
    name: str
    model: str = "gpt-4"
    system_prompt: str
    tools: list[str] = []


class EdgeDefinition(BaseModel):
    from_: str = Field(alias="from")
    to: str
    condition: Literal["always", "on_success", "on_failure"] = "always"

    class Config:
        populate_by_name = True


class InputField(BaseModel):
    name: str
    type: str
    required: bool = True


class OutputField(BaseModel):
    name: str
    type: str


class WorkflowDefinition(BaseModel):
    name: str
    description: Optional[str] = None
    version: str = "1.0"
    agents: list[AgentDefinition]
    edges: list[EdgeDefinition]
    input: list[InputField] = []
    output: list[OutputField] = []


class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    definition: WorkflowDefinition


class WorkflowResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    version: str
    definition: dict
    created_at: datetime
    updated_at: datetime


class ExecutionCreate(BaseModel):
    input_data: dict = {}


class ExecutionResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    status: str
    input_data: Optional[dict]
    output_data: Optional[dict]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error: Optional[str]


class LogResponse(BaseModel):
    id: UUID
    agent_id: Optional[str]
    step: str
    message: str
    created_at: datetime