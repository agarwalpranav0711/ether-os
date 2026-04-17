import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Callable, Awaitable

from models.log_model import LogEntry
from utils.id_generator import generate_id
from db.database import SessionLocal
from db.models import LogDB

class LogService:
    _listeners: List[Callable[[LogEntry], Awaitable[None]]] = []
    @classmethod
    def log(
        cls,
        agent: str, 
        action: str, 
        status: str, 
        message: str, 
        task_id: Optional[str] = None
    ) -> LogEntry:
        """
        Creates a structured log entry, formatting its status and saving to the database.
        """
        log_id = generate_id()
        now = datetime.now(timezone.utc).isoformat()
        
        db = SessionLocal()
        try:
            db_log = LogDB(
                id=log_id,
                task_id=task_id,
                agent=agent,
                action=action,
                status=status,
                message=message,
                timestamp=now
            )
            db.add(db_log)
            db.commit()
            
            log_entry = LogEntry(
                id=db_log.id,
                task_id=db_log.task_id,
                agent=db_log.agent,
                action=db_log.action,
                status=db_log.status,
                message=db_log.message,
                timestamp=db_log.timestamp
            )
        finally:
            db.close()
        
        # Free CLI console trace
        task_tag = f"[{task_id}] " if task_id else ""
        print(f"{log_entry.timestamp} | {agent.upper()} | {action} | {status.upper()} | {task_tag}{message}")
        
        # Notify listeners (async)
        for listener in cls._listeners:
            asyncio.create_task(listener(log_entry))
        
        return log_entry

    @classmethod
    def subscribe(cls, callback: Callable[[LogEntry], Awaitable[None]]):
        cls._listeners.append(callback)

    @classmethod
    def unsubscribe(cls, callback: Callable[[LogEntry], Awaitable[None]]):
        if callback in cls._listeners:
            cls._listeners.remove(callback)
        
    @staticmethod
    def get_logs() -> List[LogEntry]:
        db = SessionLocal()
        try:
            db_logs = db.query(LogDB).all()
            return [
                LogEntry(
                    id=lg.id,
                    task_id=lg.task_id,
                    agent=lg.agent,
                    action=lg.action,
                    status=lg.status,
                    message=lg.message,
                    timestamp=lg.timestamp
                ) for lg in db_logs
            ]
        finally:
            db.close()
        
    @staticmethod
    def get_logs_by_task(task_id: str) -> List[LogEntry]:
        db = SessionLocal()
        try:
            db_logs = db.query(LogDB).filter(LogDB.task_id == task_id).all()
            return [
                LogEntry(
                    id=lg.id,
                    task_id=lg.task_id,
                    agent=lg.agent,
                    action=lg.action,
                    status=lg.status,
                    message=lg.message,
                    timestamp=lg.timestamp
                ) for lg in db_logs
            ]
        finally:
            db.close()
