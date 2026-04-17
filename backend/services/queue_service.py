import asyncio
from typing import Optional, Dict, Any
from services.log_service import LogService

class QueueService:
    # Use a real asyncio Queue for parallel worker processing
    _queue = asyncio.Queue()
    _tasks: Dict[str, Dict[str, Any]] = {}

    @classmethod
    async def enqueue(cls, task_id: str, description: str):
        """Add a task to the queue."""
        task_data = {
            "task_id": task_id,
            "description": description,
            "status": "pending",
            "assigned_worker": None
        }
        cls._tasks[task_id] = task_data
        await cls._queue.put(task_id)
        
        LogService.log(
            task_id=task_id,
            agent="manager",
            action="enqueue",
            status="info",
            message=f"Task {task_id} enqueued"
        )

    @classmethod
    async def dequeue(cls) -> Optional[str]:
        """Get a task from the queue."""
        try:
            # Non-blocking check for empty queue if needed, 
            # but usually workers will await this
            return await cls._queue.get()
        except Exception:
            return None

    @classmethod
    def update_status(cls, task_id: str, status: str, worker_name: Optional[str] = None):
        """Update task status in the tracking dictionary."""
        if task_id in cls._tasks:
            cls._tasks[task_id]["status"] = status
            if worker_name:
                cls._tasks[task_id]["assigned_worker"] = worker_name
            
            LogService.log(
                task_id=task_id,
                agent="system",
                action="status_update",
                status="info",
                message=f"Task {task_id} status updated to {status}"
            )

    @classmethod
    def get_task_data(cls, task_id: str) -> Optional[Dict[str, Any]]:
        return cls._tasks.get(task_id)

    @classmethod
    def task_done(cls):
        cls._queue.task_done()
