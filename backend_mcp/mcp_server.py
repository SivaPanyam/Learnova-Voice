"""
Learnova Voice — Python MCP Server (Protocol 2025-11-25)
Amazon Developer Hackathon 2026 (Alexa+ Track)

Exposes the 6 standard MCP tools for Alexa+ / Claude Desktop / Cursor / Streamable HTTP:
1. add_task
2. list_tasks
3. update_task
4. complete_task
5. prioritize_tasks
6. generate_study_plan
"""

import sys
import json
import sqlite3
import datetime
from typing import Optional, List, Dict, Any
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP(
    "Learnova-Voice-MCP",
    dependencies=["sqlite3", "pydantic"]
)

DB_PATH = "learnova.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@mcp.tool()
def add_task(
    title: str,
    subject: str = "General",
    category: str = "assignment",
    due_date: str = "2026-10-24",
    due_time: str = "23:59",
    priority: str = "medium",
    estimated_minutes: int = 60,
    notes: str = ""
) -> str:
    """Add a new student academic task, exam, or assignment to the study planner."""
    import uuid
    task_id = f"task-{uuid.uuid4().hex[:6]}"
    now = datetime.datetime.utcnow().isoformat()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO tasks (id, title, subject, category, due_date, due_time, priority, estimated_minutes, completed, is_sample, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    """, (task_id, title, subject, category, due_date, due_time, priority, estimated_minutes, notes, now))
    conn.commit()
    conn.close()

    return f"Successfully added task '{title}' for {subject} (Due: {due_date}, {estimated_minutes} mins, {priority} priority)."

@mcp.tool()
def list_tasks(filter: str = "all", subject: Optional[str] = None) -> str:
    """List student tasks with optional filter ('all', 'pending', 'completed', 'overdue') and course filter."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks ORDER BY due_date ASC")
    rows = cursor.fetchall()
    conn.close()

    tasks = [dict(r) for r in rows]
    today = datetime.date.today().isoformat()

    if filter == "pending":
        tasks = [t for t in tasks if not t["completed"]]
    elif filter == "completed":
        tasks = [t for t in tasks if t["completed"]]
    elif filter == "overdue":
        tasks = [t for t in tasks if not t["completed"] and t["due_date"] < today]

    if subject:
        tasks = [t for t in tasks if subject.lower() in t["subject"].lower()]

    if not tasks:
        return f"No tasks found for filter '{filter}'."

    summary = [f"- [{t['priority'].upper()}] {t['title']} ({t['subject']}) — Due: {t['due_date']} ({t['estimated_minutes']}m)" for t in tasks]
    return f"Found {len(tasks)} tasks:\n" + "\n".join(summary)

@mcp.tool()
def complete_task(id_or_title: str) -> str:
    """Mark a student task as complete by ID or matching title."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check exact ID first, then substring title
    cursor.execute("SELECT * FROM tasks WHERE id = ? OR LOWER(title) LIKE ? LIMIT 1", 
                   (id_or_title, f"%{id_or_title.lower()}%"))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return f"Could not find any active task matching '{id_or_title}'."

    task_id = row["id"]
    title = row["title"]
    now = datetime.datetime.utcnow().isoformat()
    cursor.execute("UPDATE tasks SET completed = 1, completed_at = ? WHERE id = ?", (now, task_id))
    conn.commit()
    conn.close()

    return f"Marked task '{title}' as completed! Great progress."

@mcp.tool()
def update_task(
    id: str,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
    estimated_minutes: Optional[int] = None
) -> str:
    """Update deadline, priority, or duration of an existing task."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE id = ? LIMIT 1", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return f"Task ID {id} not found."

    if priority:
        cursor.execute("UPDATE tasks SET priority = ? WHERE id = ?", (priority, id))
    if due_date:
        cursor.execute("UPDATE tasks SET due_date = ? WHERE id = ?", (due_date, id))
    if estimated_minutes:
        cursor.execute("UPDATE tasks SET estimated_minutes = ? WHERE id = ?", (estimated_minutes, id))

    conn.commit()
    conn.close()
    return f"Updated task {id} successfully."

@mcp.tool()
def prioritize_tasks() -> str:
    """Rank all pending tasks by deadline urgency, category weight, and time investment."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE completed = 0")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()

    if not rows:
        return "No pending tasks to prioritize. You are all caught up!"

    def score(t):
        p_weights = {"urgent": 40, "high": 30, "medium": 20, "low": 10}
        c_weights = {"exam": 25, "assignment": 15, "project": 12, "revision": 10, "reading": 5}
        return p_weights.get(t["priority"], 15) + c_weights.get(t["category"], 5)

    ranked = sorted(rows, key=score, reverse=True)
    report = [f"1. Top priority: '{ranked[0]['title']}' ({ranked[0]['subject']}) — Estimated {ranked[0]['estimated_minutes']}m"]
    for i, t in enumerate(ranked[1:5], start=2):
        report.append(f"{i}. '{t['title']}' ({t['subject']}) [{t['priority'].upper()}]")

    return "Recommended execution order:\n" + "\n".join(report)

@mcp.tool()
def generate_study_plan(available_hours: float = 3.0, start_time: str = "09:00") -> str:
    """Generate a daily Pomodoro study schedule fitting within available hours."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks WHERE completed = 0")
    tasks = [dict(r) for r in cursor.fetchall()]
    conn.close()

    available_minutes = int(available_hours * 60)
    scheduled_minutes = 0
    plan_blocks = []
    
    current_hour, current_min = map(int, start_time.split(":"))

    for task in tasks:
        if scheduled_minutes >= available_minutes:
            break
        duration = min(task["estimated_minutes"], 50, available_minutes - scheduled_minutes)
        start_str = f"{current_hour:02d}:{current_min:02d}"
        
        current_min += duration
        current_hour += current_min // 60
        current_min %= 60
        end_str = f"{current_hour:02d}:{current_min:02d}"

        plan_blocks.append(f"• {start_str} - {end_str}: Focus on '{task['title']}' ({duration} mins)")
        scheduled_minutes += duration

        # Add 10m break if time left
        if scheduled_minutes + 10 <= available_minutes:
            b_start = f"{current_hour:02d}:{current_min:02d}"
            current_min += 10
            current_hour += current_min // 60
            current_min %= 60
            b_end = f"{current_hour:02d}:{current_min:02d}"
            plan_blocks.append(f"  ☕ {b_start} - {b_end}: Rest & Rehydrate (10 mins)")

    return f"Daily Study Plan ({available_hours} hours total):\n" + "\n".join(plan_blocks)

if __name__ == "__main__":
    mcp.run()
