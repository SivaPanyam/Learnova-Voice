# Learnova Voice — Python Backend & MCP Server

This directory contains the standalone Python FastAPI backend and FastMCP server for **Learnova Voice**, built for the **Amazon Developer Hackathon 2026 (Alexa+ track)**.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │   Learnova Voice React Frontend        │
                      └──────────────────┬─────────────────────┘
                                         │
                   REST / SSE JSON-RPC   ▼
      ┌──────────────────────────────────┴──────────────────────────────────┐
      │                                                                     │
┌─────▼──────────────────────────────┐    ┌─────────────────────────────────▼────────┐
│  FastAPI Backend (main.py:8000)     │    │  FastMCP Server (mcp_server.py:SSE/stdio)│
│  - REST Task CRUD                  │    │  - add_task                             │
│  - SQLite Database (learnova.db)   │    │  - list_tasks                           │
│  - Study Plan Generator API        │    │  - update_task                          │
│  - Alexa Skill Webhook handler     │    │  - complete_task                        │
│                                    │    │  - prioritize_tasks                     │
│                                    │    │  - generate_study_plan                  │
└────────────────────────────────────┘    └──────────────────────────────────────────┘
```

---

## Local Setup & Run

### 1. Requirements
- Python 3.10+
- `pip` or `uv`

### 2. Install Dependencies
```bash
cd backend_mcp
pip install -r requirements.txt
```

### 3. Run FastAPI Backend
```bash
python main.py
# Running on http://127.0.0.1:8000
# OpenAPI Docs: http://127.0.0.1:8000/docs
```

### 4. Run MCP Server
Using the MCP CLI or directly:
```bash
# Stdio mode (for Claude Desktop / Cursor / local MCP clients):
python mcp_server.py

# Or via FastMCP CLI:
mcp dev mcp_server.py
```

---

## MCP Protocol Spec (Version: 2025-11-25)

The 6 tools implemented:
1. `add_task`: Academic workload intake.
2. `list_tasks`: Filter by `all`, `pending`, `completed`, `overdue`.
3. `update_task`: Modify due dates, estimated minutes, priorities.
4. `complete_task`: Mark complete with timestamp.
5. `prioritize_tasks`: Deadline and cognitive weight ranking.
6. `generate_study_plan`: Daily timeline with Pomodoro intervals.
