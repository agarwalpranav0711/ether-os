import asyncio
from typing import Optional
from services.queue_service import QueueService

def enqueue(task_id: str) -> None:
    """Synchronous wrapper for enqueue."""
    # This is tricky because QueueService.enqueue is async.
    # We'll use a local loop if one exists, otherwise we can't easily wait.
    # However, for most FastAPI/Starlette contexts, there is a loop.
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we are in a running loop, we can't use run_until_complete
            # So we create a task
            from services.task_service import TaskService
            task = TaskService.get_task(task_id)
            desc = task.description if task else "No description"
            asyncio.create_task(QueueService.enqueue(task_id, desc))
        else:
            loop.run_until_complete(QueueService.enqueue(task_id, "Legacy task"))
    except Exception:
        # Fallback for thread safety if needed
        pass

def dequeue() -> Optional[str]:
    """Legacy dequeue - might not be reliable with async Queue."""
    return None

def is_empty() -> bool:
    return False # Not used much anymore
