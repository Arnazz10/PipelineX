from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List
from datetime import datetime

from app.database import get_db, Execution, ExecutionLog
from app.schemas import ExecutionCreate, ExecutionResponse

router = APIRouter(prefix="/executions", tags=["executions"])


@router.post("", response_model=ExecutionResponse, status_code=status.HTTP_201_CREATED)
async def create_execution(
    execution: ExecutionCreate,
    db: AsyncSession = Depends(get_db)
):
    db_execution = Execution(
        workflow_id=execution.workflow_id,
        input_data=execution.input_data,
        status="pending"
    )
    db.add(db_execution)
    await db.commit()
    await db.refresh(db_execution)
    return db_execution


@router.get("", response_model=List[ExecutionResponse])
async def list_executions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Execution).order_by(Execution.started_at.desc()))
    executions = result.scalars().all()
    return executions


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Execution).where(Execution.id == execution_id))
    execution = result.scalar_one_or_none()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.get("/logs/{execution_id}")
async def get_execution_logs(
    execution_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ExecutionLog)
        .where(ExecutionLog.execution_id == execution_id)
        .order_by(ExecutionLog.created_at)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "agent_id": log.agent_id,
            "step": log.step,
            "message": log.message,
            "created_at": log.created_at
        }
        for log in logs
    ]