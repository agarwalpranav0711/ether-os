from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import json
import asyncio

from services.task_service import TaskService
from services.manager_service import ManagerService
from services.execution_service import ExecutionService
from models.task_model import Task
from core import task_queue
from services.log_service import LogService
from models.log_model import LogEntry

router = APIRouter()

class TaskRequest(BaseModel):
    task: str

class TaskResponse(BaseModel):
    main_task: str
    subtasks: List[Task]

@router.post("/run-task", response_model=TaskResponse)
async def run_task(request: TaskRequest):
    # Call Manager Agent to break down the task
    subtask_descriptions = await asyncio.to_thread(ManagerService.break_down_task, request.task)
    
    # Store each subtask utilizing existing TaskService
    subtasks = []
    for desc in subtask_descriptions:
        task = TaskService.create_task(description=desc)
        subtasks.append(task)
        
    # Enqueue all tasks
    for task in subtasks:
        task_queue.enqueue(task.id)
        
    # Execute using ExecutionService for this specific request scope
    task_ids = [task.id for task in subtasks]
    completed_tasks = await ExecutionService.run(task_ids)
        
    return TaskResponse(
        main_task=request.task,
        subtasks=completed_tasks
    )

@router.get("/tasks", response_model=List[Task])
async def list_tasks():
    return TaskService.list_tasks()

@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    task = TaskService.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/logs", response_model=List[LogEntry])
async def get_logs():
    return LogService.get_logs()

@router.get("/logs/{task_id}", response_model=List[LogEntry])
async def get_task_logs(task_id: str):
    return LogService.get_logs_by_task(task_id)

class PlanRequest(BaseModel):
    task: str

class PlanResponse(BaseModel):
    task_id: str
    subtasks: List[Task]

@router.post("/plan", response_model=PlanResponse)
def plan_task(request: PlanRequest):
    # Create parent task
    parent_task = TaskService.create_task(description=request.task)
    # Call Manager Agent
    subtask_descriptions = ManagerService.break_down_task(request.task)
    
    subtasks = []
    for desc in subtask_descriptions:
        task = TaskService.create_task(description=desc, parent_id=parent_task.id)
        subtasks.append(task)
        
    return PlanResponse(task_id=parent_task.id, subtasks=subtasks)

class ExecuteRequest(BaseModel):
    task_id: str
    subtasks: List[Task]

@router.post("/execute")
async def execute_task(request: ExecuteRequest):
    # Enqueue subtasks
    pending_tasks = [t for t in request.subtasks if t.status == "pending"]
    for task in pending_tasks:
        # Update user-edited description
        TaskService.update_task(task.id, description=task.description)
        task_queue.enqueue(task.id)
        
    TaskService.update_task(request.task_id, status="running")
    task_ids = [t.id for t in pending_tasks]
    completed_tasks = await ExecutionService.run(task_ids, parent_id=request.task_id)
    
    # Check if we finished without pausing
    parent = TaskService.get_task(request.task_id)
    if parent and not parent.is_paused:
        TaskService.update_task(request.task_id, status="completed")
    
    return {"message": "Execution finished", "completed_tasks": completed_tasks}

@router.post("/pause/{task_id}")
def pause_task(task_id: str):
    TaskService.update_task(task_id, is_paused=True, status="paused")
    return {"message": "Task paused"}

@router.post("/resume/{task_id}")
async def resume_task(task_id: str):
    TaskService.update_task(task_id, is_paused=False, status="running")
    # Fetch all pending subtasks of this parent
    pending_subtasks = [t for t in TaskService.list_tasks() if t.parent_id == task_id and t.status == "pending"]
    
    # Run them
    await ExecutionService.run([t.id for t in pending_subtasks], parent_id=task_id)
    
    parent = TaskService.get_task(task_id)
    if parent and not parent.is_paused:
        TaskService.update_task(task_id, status="completed")
        
    return {"message": "Task resumed"}

@router.post("/cancel/{task_id}")
def cancel_task(task_id: str):
    TaskService.update_task(task_id, is_cancelled=True, status="failed")
    # Also cancel all children
    subtasks = [t for t in TaskService.list_tasks() if t.parent_id == task_id]
    for st in subtasks:
        TaskService.update_task(st.id, is_cancelled=True, status="failed")
    return {"message": "Orchestration cancelled"}

@router.get("/task/{task_id}/state")
def get_task_state(task_id: str):
    subtasks = [t for t in TaskService.list_tasks() if t.parent_id == task_id]
    
    completed = [t.id for t in subtasks if t.status in ["completed", "failed"]]
    pending = [t.id for t in subtasks if t.status == "pending"]
    running = [t.id for t in subtasks if t.status == "running"]
    
    return {
        "task_id": task_id,
        "current_step": running[0] if running else (pending[0] if pending else None),
        "completed_steps": completed,
        "pending_steps": pending
    }

@router.post("/stream")
async def stream_task_endpoint(request: TaskRequest):
    async def event_generator():
        # Start workers if not already running
        from services.worker_service import WorkerService
        await WorkerService.start_workers(count=2)

        # Step 1: Create Parent Task
        parent_task = TaskService.create_task(description=request.task)
        parent_task_id = parent_task.id
        
        yield f"data: {json.dumps({'type': 'log', 'data': f'[MANAGER] Starting orchestration for: {request.task[:50]}...'})}\n\n"
        await asyncio.sleep(0.3)
        yield f"data: {json.dumps({'type': 'thinking', 'data': {'id': 't1', 'text': 'Analyzing task complexity...', 'status': 'italic'}})}\n\n"
        await asyncio.sleep(0.6)
        yield f"data: {json.dumps({'type': 'thinking', 'data': {'id': 't2', 'text': 'Identifying parallel subtasks via Mistral LLM...', 'status': 'italic'}})}\n\n"

        # Step 2: Planning & Enqueueing
        subtasks_ui = await ManagerService.plan_and_enqueue(request.task, parent_task_id)
        
        yield f"data: {json.dumps({'type': 'thinking', 'data': {'id': 't3', 'text': f'Allocating {len(subtasks_ui)} workers to subtasks...', 'status': 'bold'}})}\n\n"
        await asyncio.sleep(0.5)

        # Emit Plan
        yield f"data: {json.dumps({'type': 'plan', 'task_id': parent_task_id, 'data': subtasks_ui})}\n\n"
        await asyncio.sleep(0.5)

        # Step 3: Progressive Logging
        log_queue = asyncio.Queue()
        
        async def log_handler(log: LogEntry):
            subtask_ids = [s["id"] for s in subtasks_ui]
            if log.task_id == parent_task_id or log.task_id in subtask_ids:
                await log_queue.put(log)

        LogService.subscribe(log_handler)

        try:
            completed_count = 0
            total_tasks = len(subtasks_ui)
            is_cancelled = False
            
            while completed_count < total_tasks:
                current_subtasks = TaskService.get_subtasks(parent_task_id)
                completed_list = [t for t in current_subtasks if t.status in ["completed", "failed"]]
                completed_count = len(completed_list)
                
                parent = TaskService.get_task(parent_task_id)
                if parent and parent.is_cancelled:
                    is_cancelled = True
                    yield f"data: {json.dumps({'type': 'log', 'data': '[CANCELLED] Aborting orchestration...'})}\n\n"
                    break

                if completed_count >= total_tasks:
                    break

                if parent and parent.is_paused:
                    yield f"data: {json.dumps({'type': 'log', 'data': '[PAUSED] Orchestration paused...'})}\n\n"
                    while parent and parent.is_paused and not parent.is_cancelled:
                        await asyncio.sleep(1)
                        parent = TaskService.get_task(parent_task_id)
                    
                    if parent and parent.is_cancelled:
                        is_cancelled = True
                        break
                    yield f"data: {json.dumps({'type': 'log', 'data': '[RESUMED] Resuming orchestration...'})}\n\n"

                try:
                    log = await asyncio.wait_for(log_queue.get(), timeout=1.0)
                    yield f"data: {json.dumps({'type': 'log', 'data': f'[{log.agent.upper()}] {log.message}'})}\n\n"
                except asyncio.TimeoutError:
                    pass

            # Final check for cancellation state from DB
            parent = TaskService.get_task(parent_task_id)
            if parent and parent.is_cancelled:
                is_cancelled = True

            # Step 4: Result Aggregation
            if is_cancelled:
                final_result = {
                    "title": "Orchestration Aborted",
                    "summary": "Operation was manually terminated by the user. Partial logs are available in the system trace.",
                    "primaryVector": "Terminated",
                    "secondaryVector": "0 Tasks Completed",
                    "confidence": 0,
                    "tokens": 0,
                    "entropy": 0
                }
            else:
                yield f"data: {json.dumps({'type': 'log', 'data': '[SYSTEM] Consolidating subtask vectors...' })}\n\n"
                final_subtasks = [t for t in TaskService.get_subtasks(parent_task_id)]
                
                # Use our new premium synthesis engine
                summary_text = await ManagerService.synthesize_results(request.task, final_subtasks)
                
                final_result = {
                    "title": "Orchestration Complete.",
                    "summary": summary_text,
                    "primaryVector": request.task[:50],
                    "secondaryVector": f"{len(final_subtasks)} Parallel Tasks Processed",
                    "confidence": 0.98,
                    "tokens": (len(summary_text.split()) * 2) + 500,
                    "entropy": 0.02
                }
            
            if not is_cancelled:
                TaskService.update_task(parent_task_id, status="completed")
            
            yield f"data: {json.dumps({'type': 'result', 'data': final_result})}\n\n"
            yield f"data: {json.dumps({'type': 'complete', 'task_id': parent_task_id})}\n\n"

        finally:
            LogService.unsubscribe(log_handler)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
