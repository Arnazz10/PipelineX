from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List

from app.database import get_db, Workflow
from app.schemas import WorkflowCreate, WorkflowUpdate, WorkflowResponse

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow: WorkflowCreate,
    db: AsyncSession = Depends(get_db)
):
    db_workflow = Workflow(
        name=workflow.name,
        description=workflow.description,
        definition=workflow.definition
    )
    db.add(db_workflow)
    await db.commit()
    await db.refresh(db_workflow)
    return db_workflow


@router.get("", response_model=List[WorkflowResponse])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workflow).order_by(Workflow.created_at.desc()))
    workflows = result.scalars().all()
    return workflows


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: UUID,
    workflow_update: WorkflowUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow_update.name is not None:
        workflow.name = workflow_update.name
    if workflow_update.description is not None:
        workflow.description = workflow_update.description
    if workflow_update.definition is not None:
        workflow.definition = workflow_update.definition
    
    await db.commit()
    await db.refresh(workflow)
    return workflow


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await db.delete(workflow)
    await db.commit()
    return None