from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class Task(BaseModel):
    id: str
    parent_id: Optional[str] = None
    description: str
    status: str = "pending"
    result: Optional[str] = None
    assigned_worker: Optional[str] = None
    is_paused: bool = False
    is_cancelled: bool = False
    created_at: str
    updated_at: str
