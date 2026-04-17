from pydantic import BaseModel
from typing import Optional

class LogEntry(BaseModel):
    id: str
    task_id: Optional[str] = None
    agent: str  # "manager", "worker", "execution", "system"
    action: str
    status: str  # "info", "success", "error"
    message: str
    timestamp: str
