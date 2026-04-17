from sqlalchemy import Column, String, Text, Boolean
from db.database import Base

class TaskDB(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    parent_id = Column(String, index=True, nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String, default="pending")
    result = Column(Text, nullable=True)
    assigned_worker = Column(String, nullable=True)
    is_paused = Column(Boolean, default=False)
    is_cancelled = Column(Boolean, default=False)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

class LogDB(Base):
    __tablename__ = "logs"

    id = Column(String, primary_key=True, index=True)
    task_id = Column(String, index=True, nullable=True)
    agent = Column(String, nullable=False)
    action = Column(String, nullable=False)
    status = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)
