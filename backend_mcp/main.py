"""
Learnova Voice — FastAPI Backend & SQLite Storage
Amazon Developer Hackathon 2026 (Alexa+ & MCP Track)

Provides REST endpoints for tasks, daily study schedule calculations,
and Alexa Skill webhook simulation.
"""

import os
import sqlite3
from typing import List, Optional
from datetime import datetime, date
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Learnova Voice API",
    description="Backend service and Alexa+ connector for Learnova Voice",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.getenv("SQLITE_DB_PATH", "learnova.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        category TEXT NOT NULL,
        due_date TEXT NOT NULL,
        due_time TEXT,
        priority TEXT NOT NULL,
        estimated_minutes INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        is_sample INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)
    conn.commit()
    conn.close()

init_db()

class TaskCreate(BaseModel):
    title: str
    subject: str = "General"
    category: str = "assignment"
    dueDate: str
    dueTime: Optional[str] = "23:59"
    priority: str = "medium"
    estimatedMinutes: int = 60
    notes: Optional[str] = ""

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    category: Optional[str] = None
    dueDate: Optional[str] = None
    priority: Optional[str] = None
    estimatedMinutes: Optional[int] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    subject: str
    category: str
    dueDate: str
    dueTime: Optional[str]
    priority: str
    estimatedMinutes: int
    completed: bool
    completedAt: Optional[str]
    isSample: bool
    notes: Optional[str]
    createdAt: str

def row_to_task(row) -> dict:
    return {
        "id": row[0],
        "title": row[1],
        "subject": row[2],
        "category": row[3],
        "dueDate": row[4],
        "dueTime": row[5],
        "priority": row[6],
        "estimatedMinutes": row[7],
        "completed": bool(row[8]),
        "completedAt": row[9],
        "isSample": bool(row[10]),
        "notes": row[11],
        "createdAt": row[12],
    }

@app.get("/api/tasks", response_model=List[TaskResponse])
def get_tasks(filter: str = Query("all", enum=["all", "pending", "completed", "overdue"])):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    tasks = [row_to_task(r) for r in rows]
    today_str = date.today().isoformat()

    if filter == "pending":
        return [t for t in tasks if not t["completed"]]
    elif filter == "completed":
        return [t for t in tasks if t["completed"]]
    elif filter == "overdue":
        return [t for t in tasks if not t["completed"] and t["dueDate"] < today_str]
    return tasks

@app.post("/api/tasks", response_model=TaskResponse, status_code=201)
def create_task(task: TaskCreate):
    import uuid
    task_id = f"task-{uuid.uuid4().hex[:8]}"
    created_at = datetime.utcnow().isoformat()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO tasks (id, title, subject, category, due_date, due_time, priority, estimated_minutes, completed, is_sample, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    """, (task_id, task.title, task.subject, task.category, task.dueDate, task.dueTime, task.priority, task.estimatedMinutes, task.notes, created_at))
    conn.commit()
    conn.close()

    return {
        "id": task_id,
        "title": task.title,
        "subject": task.subject,
        "category": task.category,
        "dueDate": task.dueDate,
        "dueTime": task.dueTime,
        "priority": task.priority,
        "estimatedMinutes": task.estimatedMinutes,
        "completed": False,
        "completedAt": None,
        "isSample": False,
        "notes": task.notes,
        "createdAt": created_at,
    }

@app.put("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, updates: TaskUpdate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")

    current = row_to_task(row)
    new_title = updates.title if updates.title is not None else current["title"]
    new_subject = updates.subject if updates.subject is not None else current["subject"]
    new_category = updates.category if updates.category is not None else current["category"]
    new_due_date = updates.dueDate if updates.dueDate is not None else current["dueDate"]
    new_priority = updates.priority if updates.priority is not None else current["priority"]
    new_est_mins = updates.estimatedMinutes if updates.estimatedMinutes is not None else current["estimatedMinutes"]
    new_completed = updates.completed if updates.completed is not None else current["completed"]
    new_completed_at = datetime.utcnow().isoformat() if (new_completed and not current["completed"]) else current["completedAt"]
    new_notes = updates.notes if updates.notes is not None else current["notes"]

    cursor.execute("""
    UPDATE tasks SET
        title = ?, subject = ?, category = ?, due_date = ?, priority = ?,
        estimated_minutes = ?, completed = ?, completed_at = ?, notes = ?
    WHERE id = ?
    """, (new_title, new_subject, new_category, new_due_date, new_priority, new_est_mins, int(new_completed), new_completed_at, new_notes, task_id))
    conn.commit()
    conn.close()

    current.update({
        "title": new_title,
        "subject": new_subject,
        "category": new_category,
        "dueDate": new_due_date,
        "priority": new_priority,
        "estimatedMinutes": new_est_mins,
        "completed": new_completed,
        "completedAt": new_completed_at,
        "notes": new_notes,
    })
    return current

@app.post("/api/study-plan/generate")
def generate_study_plan(available_hours: float = 3.0, start_time: str = "09:00"):
    tasks = get_tasks(filter="pending")
    # Urgency ranking
    def urgency(t):
        weight = {"urgent": 40, "high": 30, "medium": 20, "low": 10}.get(t["priority"], 15)
        return weight

    sorted_tasks = sorted(tasks, key=urgency, reverse=True)
    return {
        "status": "success",
        "availableHours": available_hours,
        "startTime": start_time,
        "tasksScheduled": len(sorted_tasks),
        "tasks": sorted_tasks
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
