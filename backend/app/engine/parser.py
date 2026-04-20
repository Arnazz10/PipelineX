import yaml
from typing import Any, Optional
from pydantic import ValidationError

from app.models import (
    WorkflowDefinition, 
    AgentDefinition, 
    EdgeDefinition, 
    InputField, 
    OutputField,
    ToolDefinition
)


class WorkflowParser:
    @staticmethod
    def parse(yaml_content: str) -> WorkflowDefinition:
        try:
            data = yaml.safe_load(yaml_content)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML: {str(e)}")
        
        if not data:
            raise ValueError("Empty workflow definition")
        
        try:
            return WorkflowDefinition(**data)
        except ValidationError as e:
            errors = []
            for error in e.errors():
                field = ".".join(str(loc) for loc in error["loc"])
                errors.append(f"{field}: {error['msg']}")
            raise ValueError(f"Validation errors: {'; '.join(errors)}")
    
    @staticmethod
    def validate(workflow: WorkflowDefinition) -> tuple[bool, Optional[str]]:
        agent_ids = {agent.id for agent in workflow.agents}
        
        for edge in workflow.edges:
            if edge.from_ not in agent_ids:
                return False, f"Edge references non-existent agent: {edge.from_}"
            if edge.to not in agent_ids:
                return False, f"Edge references non-existent agent: {edge.to}"
        
        return True, None
    
    @staticmethod
    def to_json(workflow: WorkflowDefinition) -> dict:
        return workflow.model_dump(by_alias=True)
    
    @staticmethod
    def from_json(data: dict) -> WorkflowDefinition:
        return WorkflowDefinition(**data)