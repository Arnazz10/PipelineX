from typing import Any, Callable, Awaitable, Optional
from uuid import UUID
from datetime import datetime
import json
import asyncio

from app.database import Execution, ExecutionLog, async_session
from app.engine.parser import WorkflowParser
from app.engine.agents import WorkflowExecutor
from app.models import WorkflowDefinition


class WorkflowExecutionManager:
    def __init__(self):
        self.active_executions: dict[UUID, WorkflowExecutor] = {}
    
    async def create_execution(
        self,
        workflow_id: UUID,
        workflow_def: dict,
        input_data: dict,
        callback: Optional[Callable] = None
    ) -> UUID:
        execution_id = UUID(str(uuid.uuid4()))
        
        async with async_session() as db:
            execution = Execution(
                id=execution_id,
                workflow_id=workflow_id,
                input_data=input_data,
                status="running",
                started_at=datetime.utcnow()
            )
            db.add(execution)
            await db.commit()
        
        asyncio.create_task(
            self._run_execution(execution_id, workflow_def, input_data, callback)
        )
        
        return execution_id
    
    async def _run_execution(
        self,
        execution_id: UUID,
        workflow_def: dict,
        input_data: dict,
        callback: Optional[Callable] = None
    ):
        try:
            executor = WorkflowExecutor(workflow_def)
            self.active_executions[execution_id] = executor
            
            await self._log(execution_id, "system", "started", "Execution started")
            
            if callback:
                await callback({
                    "type": "status",
                    "status": "running",
                    "execution_id": str(execution_id)
                })
            
            result = await executor.execute(input_data, callback=lambda msg: self._handle_step(
                execution_id, msg, callback
            ))
            
            async with async_session() as db:
                from sqlalchemy import select
                execution = (await db.execute(
                    select(Execution).where(Execution.id == execution_id)
                )).scalar_one()
                
                execution.status = "success" if result.get("status") == "success" else "failed"
                execution.output_data = result.get("outputs", {})
                execution.completed_at = datetime.utcnow()
                execution.error = result.get("error")
                
                await db.commit()
            
            await self._log(execution_id, "system", "completed", 
                          f"Execution {execution.status}")
            
            if callback:
                await callback({
                    "type": "status",
                    "status": execution.status,
                    "outputs": result.get("outputs", {}),
                    "error": result.get("error")
                })
        
        except Exception as e:
            async with async_session() as db:
                from sqlalchemy import select
                execution = (await db.execute(
                    select(Execution).where(Execution.id == execution_id)
                )).scalar_one_or_none()
                
                if execution:
                    execution.status = "failed"
                    execution.error = str(e)
                    execution.completed_at = datetime.utcnow()
                    await db.commit()
            
            await self._log(execution_id, "system", "error", str(e))
            
            if callback:
                await callback({
                    "type": "status",
                    "status": "failed",
                    "error": str(e)
                })
        
        finally:
            self.active_executions.pop(execution_id, None)
    
    async def _handle_step(
        self,
        execution_id: UUID,
        message: dict,
        callback: Optional[Callable] = None
    ):
        await self._log(
            execution_id,
            message.get("agent_id", "system"),
            message.get("step", "step"),
            json.dumps(message)
        )
        
        if callback:
            await callback({
                "type": "step",
                "step": message
            })
    
    async def _log(self, execution_id: UUID, agent_id: str, step: str, message: str):
        async with async_session() as db:
            log = ExecutionLog(
                execution_id=execution_id,
                agent_id=agent_id,
                step=step,
                message=message
            )
            db.add(log)
            await db.commit()
    
    def get_status(self, execution_id: UUID) -> Optional[str]:
        executor = self.active_executions.get(execution_id)
        return "running" if executor else None


import uuid
execution_manager = WorkflowExecutionManager()