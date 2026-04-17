from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.task_routes import router as task_router

from db.database import engine
from db.models import Base

# Create database tables
Base.metadata.create_all(bind=engine)

import os
from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Agent-OS Lite Backend")

# Allow CORS for Next.js frontend
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
