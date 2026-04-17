import asyncio
import random
from typing import Optional
from services.log_service import LogService
from services.queue_service import QueueService
from services.tool_service import ToolService
from services.task_service import TaskService

class Worker:
    def __init__(self, name: str):
        self.name = name
        self.is_running = False

    async def start(self):
        self.is_running = True
        LogService.log(agent=self.name, action="start", status="success", message=f"{self.name} started and waiting for tasks.")
        
        while self.is_running:
            task_id = await QueueService.dequeue()
            if task_id:
                # Check for cancellation before processing
                task_data = TaskService.get_task(task_id)
                if task_data and task_data.is_cancelled:
                    LogService.log(task_id=task_id, agent=self.name, action="cancel", status="info", message=f"[{self.name}] Task {task_id} skipped (cancelled)")
                    TaskService.update_task(task_id, status="failed", result="Cancelled")
                    QueueService.task_done()
                    continue
                    
                await self.process_task(task_id)
                QueueService.task_done()
            else:
                await asyncio.sleep(0.5)

    async def stop(self):
        self.is_running = False

    async def process_task(self, task_id: str):
        task = TaskService.get_task(task_id)
        if not task:
            return

        description = task.description
        parent_id = task.parent_id
        
        QueueService.update_status(task_id, "running", self.name)
        TaskService.update_task(task_id, status="running", assigned_worker=self.name)
        
        LogService.log(
            task_id=task_id,
            agent=self.name,
            action="execute",
            status="info",
            message=f"[{self.name}] Started task {task_id}"
        )

        retries = 0
        max_retries = 1
        success = False
        result = ""

        current_desc = description

        while retries <= max_retries and not success:
            # Deep check for pause or cancellation
            cancel_all = False
            paused = False
            if parent_id:
                parent = TaskService.get_task(parent_id)
                if parent:
                    paused = parent.is_paused
                    cancel_all = parent.is_cancelled
            
            curr_task = TaskService.get_task(task_id)
            if curr_task:
                if curr_task.is_paused: paused = True
                if curr_task.is_cancelled: cancel_all = True

            if cancel_all:
                LogService.log(task_id=task_id, agent=self.name, action="cancel", status="info", message=f"[{self.name}] Task {task_id} stopping (cancelled)")
                break

            if paused:
                LogService.log(task_id=task_id, agent=self.name, action="pause", status="info", message=f"[{self.name}] Task {task_id} waiting (system paused)")
                while paused:
                    await asyncio.sleep(1)
                    if parent_id:
                        parent = TaskService.get_task(parent_id)
                        if parent: 
                            paused = parent.is_paused
                            if parent.is_cancelled: cancel_all = True; break
                    else:
                        curr_task = TaskService.get_task(task_id)
                        if curr_task: 
                            paused = curr_task.is_paused
                            if curr_task.is_cancelled: cancel_all = True; break
                
                if cancel_all: break
                LogService.log(task_id=task_id, agent=self.name, action="resume", status="info", message=f"[{self.name}] Task {task_id} resuming")

            try:
                # Step 4 logic: Decide tool
                if "search" in current_desc.lower():
                    result = await ToolService.search_tool(current_desc, self.name)
                else:
                    result = await ToolService.llm_tool(current_desc, self.name)
                
                success = True
            except Exception as e:
                retries += 1
                if retries <= max_retries:
                    LogService.log(
                        task_id=task_id,
                        agent=self.name,
                        action="retry",
                        status="warning",
                        message=f"[RETRY] Task {task_id} failed. Retrying with modified input..."
                    )
                    # Modify input for self-healing
                    current_desc = f"RETRY ATTEMPT: {current_desc}"
                    await asyncio.sleep(1)
                else:
                    LogService.log(
                        task_id=task_id,
                        agent=self.name,
                        action="error",
                        status="error",
                        message=f"[ERROR] Task {task_id} failed after {max_retries} retries: {str(e)}"
                    )
                    result = f"Failed after retries: {str(e)}"

        status = "completed" if success else "failed"
        QueueService.update_status(task_id, status)
        TaskService.update_task(task_id, status=status, result=result)
        
        LogService.log(
            task_id=task_id,
            agent=self.name,
            action="complete",
            status="success" if success else "error",
            message=f"[{self.name}] Finished task {task_id} with status {status}"
        )

class WorkerService:
    _workers = []
    _tasks = []

    @classmethod
    async def start_workers(cls, count: int = 2):
        if not cls._workers:
            for i in range(count):
                worker = Worker(name=f"worker_{i+1}")
                cls._workers.append(worker)
                task = asyncio.create_task(worker.start())
                cls._tasks.append(task)
    
    @classmethod
    async def stop_workers(cls):
        for worker in cls._workers:
            await worker.stop()
        for task in cls._tasks:
            task.cancel()
        cls._workers = []
        cls._tasks = []
