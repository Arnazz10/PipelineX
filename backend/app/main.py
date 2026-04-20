from fastapi import FastAPI, WebSocket, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import json

from app.config import settings
from app.database import get_db, init_db, Workflow, Execution
from app.api import workflows, executions
from app.engine.parser import WorkflowParser
from app.engine.executor import execution_manager
from app.websocket import websocket_endpoint, notify_execution
from app.schemas import ExecutionCreate

app = FastAPI(
    title="LLM Workflow Orchestration Engine",
    description="A workflow engine where users define AI pipelines in YAML",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflows.router)
app.include_router(executions.router)

app.websocket("/ws/execute/{execution_id}")(websocket_endpoint)


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/")
async def root():
    return {
        "name": "LLM Workflow Orchestration Engine",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.post("/workflows/{workflow_id}/execute", response_model=dict)
async def execute_workflow(
    workflow_id: UUID,
    execution_input: ExecutionCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow_def = workflow.definition
    
    try:
        parser = WorkflowParser()
        wf = parser.from_json(workflow_def)
        valid, error = parser.validate(wf)
        if not valid:
            raise HTTPException(status_code=400, detail=error)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid workflow: {str(e)}")

    exec_manager = execution_manager
    exec_id = await exec_manager.create_execution(
        workflow_id=workflow_id,
        workflow_def=workflow_def,
        input_data=execution_input.input_data or {},
        callback=lambda msg, eid=str(workflow_id): notify_execution(eid, msg)
    )

    return {
        "execution_id": str(exec_id),
        "status": "started"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)