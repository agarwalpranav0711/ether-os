import asyncio
from typing import List, Optional

from models.task_model import Task
from services.task_service import TaskService
from services.worker_service import WorkerService
from services.log_service import LogService
from services.queue_service import QueueService

class ExecutionService:
    @classmethod
    async def run(cls, task_ids: List[str], parent_id: Optional[str] = None) -> List[Task]:
        """
        Modified to use parallel workers. 
        Enqueues tasks and waits for their completion.
        """
        # Ensure workers are running
        await WorkerService.start_workers()

        for t_id in task_ids:
            task = TaskService.get_task(t_id)
            if task and task.status == "pending":
                await QueueService.enqueue(t_id, task.description)

        # Wait for these specific tasks to reach a terminal state
        processed_tasks = []
        pending_ids = set(task_ids)
        
        while pending_ids:
            for t_id in list(pending_ids):
                task = TaskService.get_task(t_id)
                if task and task.status in ["completed", "failed"]:
                    processed_tasks.append(task)
                    pending_ids.remove(t_id)
            
            if pending_ids:
                await asyncio.sleep(0.5)
                # Check for pause on parent
                if parent_id:
                    parent_task = TaskService.get_task(parent_id)
                    if parent_task and parent_task.is_paused:
                        # Wait for unpause
                        while parent_task and parent_task.is_paused:
                            await asyncio.sleep(1)
                            parent_task = TaskService.get_task(parent_id)

        return processed_tasks
