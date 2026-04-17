from datetime import datetime, timezone
from typing import List, Optional

from models.task_model import Task
from utils.id_generator import generate_id
from services.log_service import LogService
from db.database import SessionLocal
from db.models import TaskDB

class TaskService:
    @staticmethod
    def create_task(description: str, parent_id: Optional[str] = None) -> Task:
        task_id = generate_id()
        now = datetime.now(timezone.utc).isoformat()
        
        db = SessionLocal()
        try:
            db_task = TaskDB(
                id=task_id,
                parent_id=parent_id,
                description=description,
                status="pending",
                is_paused=False,
                is_cancelled=False,
                created_at=now,
                updated_at=now
            )
            db.add(db_task)
            db.commit()
            
            task = Task(
                id=db_task.id,
                parent_id=db_task.parent_id,
                description=db_task.description,
                status=db_task.status,
                result=db_task.result,
                assigned_worker=db_task.assigned_worker,
                is_paused=db_task.is_paused,
                is_cancelled=db_task.is_cancelled,
                created_at=db_task.created_at,
                updated_at=db_task.updated_at
            )
        finally:
            db.close()
        
        LogService.log(
            task_id=task.id,
            agent="system",
            action="create_task",
            status="info",
            message=f"Task created with ID {task.id}"
        )
        
        return task

    @staticmethod
    def get_task(task_id: str) -> Optional[Task]:
        db = SessionLocal()
        try:
            db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
            if not db_task:
                return None
            return Task(
                id=db_task.id,
                parent_id=db_task.parent_id,
                description=db_task.description,
                status=db_task.status,
                result=db_task.result,
                is_paused=db_task.is_paused,
                is_cancelled=db_task.is_cancelled,
                created_at=db_task.created_at,
                updated_at=db_task.updated_at
            )
        finally:
            db.close()

    @staticmethod
    def update_task(
        task_id: str, 
        status: Optional[str] = None, 
        result: Optional[str] = None,
        description: Optional[str] = None,
        assigned_worker: Optional[str] = None,
        is_paused: Optional[bool] = None,
        is_cancelled: Optional[bool] = None
    ) -> Optional[Task]:
        db = SessionLocal()
        try:
            db_task = db.query(TaskDB).filter(TaskDB.id == task_id).first()
            if not db_task:
                return None
                
            if status is not None:
                db_task.status = status
            if result is not None:
                db_task.result = result
            if description is not None:
                db_task.description = description
            if assigned_worker is not None:
                db_task.assigned_worker = assigned_worker
            if is_paused is not None:
                db_task.is_paused = is_paused
            if is_cancelled is not None:
                db_task.is_cancelled = is_cancelled
                
            db_task.updated_at = datetime.now(timezone.utc).isoformat()
            db.commit()
            
            return Task(
                id=db_task.id,
                parent_id=db_task.parent_id,
                description=db_task.description,
                status=db_task.status,
                result=db_task.result,
                is_paused=db_task.is_paused,
                is_cancelled=db_task.is_cancelled,
                created_at=db_task.created_at,
                updated_at=db_task.updated_at
            )
        finally:
            db.close()

    @staticmethod
    def list_tasks() -> List[Task]:
        db = SessionLocal()
        try:
            db_tasks = db.query(TaskDB).all()
            return [
                Task(
                    id=t.id,
                    parent_id=t.parent_id,
                    description=t.description,
                    status=t.status,
                    result=t.result,
                    assigned_worker=t.assigned_worker,
                    is_paused=t.is_paused,
                    is_cancelled=t.is_cancelled,
                    created_at=t.created_at,
                    updated_at=t.updated_at
                ) for t in db_tasks
            ]
        finally:
            db.close()
    @staticmethod
    def get_subtasks(parent_id: str) -> List[Task]:
        db = SessionLocal()
        try:
            db_tasks = db.query(TaskDB).filter(TaskDB.parent_id == parent_id).all()
            return [
                Task(
                    id=t.id,
                    parent_id=t.parent_id,
                    description=t.description,
                    status=t.status,
                    result=t.result,
                    assigned_worker=t.assigned_worker,
                    is_paused=t.is_paused,
                    is_cancelled=t.is_cancelled,
                    created_at=t.created_at,
                    updated_at=t.updated_at
                ) for t in db_tasks
            ]
        finally:
            db.close()
