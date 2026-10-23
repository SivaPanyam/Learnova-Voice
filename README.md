# 🎓 Learnova Voice — AI Study Planning Assistant

> **Amazon Developer Hackathon 2026 — Alexa+ & Model Context Protocol (MCP) Track MVP**  
> An intelligent, voice-first study planning assistant that organizes coursework, balances impending deadlines, prevents exam crunch with algorithmic priority queueing, and generates time-blocked daily schedules with Pomodoro cognitive recovery breaks.

[![Hackathon Track](https://img.shields.io/badge/Amazon%20Developer%20Hackathon-Alexa%2B%20Track%202026-ff9900?style=for-the-badge&logo=amazon)](https://developer.amazon.com)
[![Protocol Version](https://img.shields.io/badge/MCP%20Protocol-2025--11--25-6366f1?style=for-the-badge)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev)
[![Gemini](https://img.shields.io/badge/Gemini%20AI-3.8%20Flash-4285f4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=for-the-badge)](LICENSE)

---

## 🌟 Executive Summary & Problem Statement

College and high school students frequently face **cognitive overload**: juggling simultaneous homework assignments, upcoming midterm exams, lab write-ups, and syllabus readings. Traditional calendar tools require tedious manual entry and do not account for relative urgency, assignment cognitive weights, or realistic energy limits.

**Learnova Voice** bridges this gap as an **Alexa+ voice assistant** powered by the **Model Context Protocol (MCP)**:
1. **Natural Language Workload Intake**: Students speak naturally: *"I have an exam on Friday and two assignments due tomorrow. Help me plan."*
2. **Algorithmic Prioritizer Engine**: Evaluates deadlines, estimated duration, course stakes, and overdue penalties into a mathematically ranked queue.
3. **Automated Daily Study Schedule**: Allocates study hours into 50-minute Pomodoro focus blocks interlaced with 10-minute cognitive recovery breaks.
4. **Autonomous MCP Tool Calling**: Changes to the study plan or assignments execute real application state mutations rather than superficial simulated responses.
5. **Audible Alexa+ Speech Feedback**: Employs real-time Web Speech Synthesis to communicate schedules back to the student verbally.

---

## 🏗️ Architecture Overview

Learnova Voice is designed with a modular, decoupled full-stack architecture that supports both interactive web prototyping and self-hosted local MCP client integration (e.g., Alexa Skill developer endpoints, Claude Desktop, Cursor).

```
                            ┌───────────────────────────────────────────────┐
                            │          Alexa+ Voice / Student UI            │
                            │   (SpeechSynthesis, Push-to-Talk, Waveform)   │
                            └───────────────────────┬───────────────────────┘
                                                    │
                                                    ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   React 19 Frontend Client                                       │
│  - Dashboard & Workload Overview                 - My Tasks & Urgent Queue                       │
│  - Daily Timeline Generator & Focus Score        - MCP Live Console & Tool Sandbox               │
│  - Central State & Offline localStorage Sync     - Assistant Slide-out Drawer                    │
└──────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                           │
                        REST / SSE JSON-RPC│ (/api/*)
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             Full-Stack Node / Express Gateway (server.ts)                        │
│                                                                                                  │
│  ┌─────────────────────────┐   ┌───────────────────────────┐   ┌──────────────────────────────┐  │
│  │   REST Task Endpoints   │   │  Gemini 3.8 Flash Proxy   │   │     Streamable HTTP MCP      │  │
│  │  GET/POST /api/tasks    │   │  Secure server-side key   │   │   /api/mcp/manifest          │  │
│  │  PUT/DELETE /api/tasks  │   │  Function tool calling    │   │   /api/mcp/rpc (JSON-RPC 2)  │  │
│  │  POST /api/tasks/reset  │   │  Local deterministic fallb│   │   /api/mcp/sse (EventStream) │  │
│  └─────────────────────────┘   └───────────────────────────┘   └──────────────────────────────┘  │
└──────────────────────────────────────────┬───────────────────────────────────────────────────────┘
                                           │ (Dual Mode Support)
                                           ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                     Standalone Python Backend & FastMCP Server (/backend_mcp)                    │
│                                                                                                  │
│  ┌──────────────────────────────────────────┐     ┌───────────────────────────────────────────┐  │
│  │      FastAPI Backend (main.py:8000)      │     │      FastMCP Server (mcp_server.py)       │  │
│  │  - SQLite Database (learnova.db)         │     │  - FastMCP standard tool definitions      │  │
│  │  - Study plan calculation endpoint       │     │  - Stdio & SSE transport modes            │  │
│  │  - Alexa Skill webhook handler           │     │  - Compatible with Claude Desktop / Cursor│  │
│  └──────────────────────────────────────────┘     └───────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

### 1. 📊 Student Study Dashboard
- **Live Workload Statistics**: Pending tasks count, total hours required, completion percentage bar, and daily Focus Score.
- **Recommended Next Step**: Dynamically selects and highlights the single highest urgency task to tackle immediately to clear impending deadlines.
- **Quick Voice Prompts**: One-click prompt cards for common student queries.
- **Today's Timeline Preview**: At-a-glance preview of scheduled focus intervals and wellness breaks.

### 2. 📝 Coursework & Task Management (`My Tasks`)
- **Add / Edit Task Modal**: Validates task title, subject, category (Exam, Assignment, Revision, Reading, Project, Other), due date, due time, priority (Urgent, High, Medium, Low), estimated minutes, and syllabus notes.
- **Celebratory Visual Feedback**: Triggers confetti animation upon task completion.
- **Smart Filters & Search**: Filter by status (**All**, **Pending**, **Completed**, **Overdue**), course subject, or priority level. Sort by **Urgency Score**, **Due Date**, **Duration**, or **Alphabetical**.
- **Transparent Sample Data**: Clearly demarcates demo assignments with a `SAMPLE` badge, distinguishing them from user-created tasks.

### 3. ⏱️ Personalized Study Planner & Timeline
- **Customizable Capacity**: Select available study hours (0.5h to 12h) and target starting time (e.g. `09:00 AM`).
- **Pomodoro Time-Blocking**: Automatically chunks assignments longer than 50 minutes and schedules 10-minute cognitive recovery breaks between sessions.
- **Interactive Checklist**: Students can check off individual study blocks as they complete them throughout the day.
- **One-Click Markdown Export**: Download a cleanly formatted `.md` schedule for study logs or offline planning.

### 4. 🎙️ Alexa+ Simulation & MCP Live Console
- **Simulated Voice Terminal**: Push-to-talk simulation with live visual audio waveforms.
- **Spoken Audio Output**: Uses the browser's native `SpeechSynthesis` API to speak answers aloud in natural speech.
- **Real-Time MCP Event Stream**: Real-time audit log of JSON-RPC 2.0 tool calls showing exact tool names, arguments, return data, and execution latency in milliseconds.
- **MCP Tool Sandbox**: Directly invoke any of the 6 MCP tools with custom JSON payloads and observe real-time state mutations.

### 5. 🤖 Autonomous Conversational Assistant
- **Real State Actions**: When the assistant is asked to add a task, prioritize assignments, or mark a task done, it updates application state and recalculates study statistics immediately.
- **Dual-Engine Architecture**:
  - **Gemini 3.8 Flash**: Server-side tool calling via `@google/genai` when `GEMINI_API_KEY` is configured.
  - **Deterministic Fallback Engine**: Rule-based natural language parser (`nlpParser.ts`) that accurately resolves all student intents with zero external API dependencies.

---

## 🛠️ Model Context Protocol (MCP) Tools Specification

Conforms to **MCP Protocol Version `2025-11-25`**. Exposes 6 core tools:

| Tool Name | Parameters | Description |
|---|---|---|
| `add_task` | `title` (req), `subject`, `category`, `dueDate`, `dueTime`, `priority`, `estimatedMinutes`, `notes` | Creates a new academic assignment or exam in the workload database. |
| `list_tasks` | `filter` (`all`, `pending`, `completed`, `overdue`), `subject` | Retrieves filtered list of student coursework. |
| `update_task` | `id` (req), `title`, `priority`, `dueDate`, `estimatedMinutes`, `completed` | Modifies properties of an existing task. |
| `complete_task` | `idOrTitle` (req) | Marks a task as completed given its unique ID or title fragment. |
| `prioritize_tasks` | `referenceDate` | Computes urgency scores across all uncompleted tasks and returns an ordered queue. |
| `generate_study_plan` | `availableHours` (req), `startTime` | Generates a daily Pomodoro schedule with breaks fitting available hours. |

### Urgency Scoring Algorithm
$$\text{Urgency Score} = \text{Priority Weight} + \text{Category Weight} + \text{Deadline Score} + \text{Duration Factor}$$

- **Priority Weights**: `urgent` (+40), `high` (+30), `medium` (+20), `low` (+10).
- **Category Weights**: `exam` (+25), `assignment` (+15), `project` (+12), `revision` (+10), `reading` (+5).
- **Deadline Urgency**: Overdue ($+60 + 5 \times \text{days overdue}$), Due today (+45), Due tomorrow (+32), Due $\le 3\text{d}$ (+20), Due $\le 7\text{d}$ (+10).
- **Duration Factor**: Tasks taking $\ge 90\text{m}$ receive early-start weight (+8). Completed tasks are assigned $-100$.

---

## 🗣️ Supported Alexa+ Natural Language Prompts

You can test these directly in the app or via the Alexa+ Voice Terminal:

| Voice Utterance | Executed MCP Tools | Resulting Action |
|---|---|---|
| *"I have an exam on Friday and two assignments due tomorrow. Help me plan."* | `add_task` $\times 3$, `generate_study_plan` | Creates 3 structured tasks, prioritizes assignments due tomorrow first, and generates a 4-hour study plan. |
| *"Add a two-hour mathematics revision task for tomorrow."* | `add_task` | Adds high-priority 120-minute Mathematics revision task scheduled for tomorrow. |
| *"Which task should I complete first?"* | `prioritize_tasks` | Analyzes pending workload and recommends the highest urgency task with rationale. |
| *"Show me my overdue assignments."* | `list_tasks(filter='overdue')` | Scans for overdue deadlines and advises immediate recovery blocks. |
| *"Mark the completed assignment as done."* | `complete_task` | Matches active assignment, sets completion timestamp, and triggers confetti. |
| *"Alexa, plan 3 hours of study today."* | `generate_study_plan(availableHours=3)` | Calculates a 3-hour study timeline with Pomodoro intervals. |

---

## 📂 Repository Structure

```
learnova-voice/
├── backend_mcp/                  # Standalone Python FastAPI & FastMCP Server
│   ├── main.py                   # FastAPI REST API with SQLite database
│   ├── mcp_server.py             # Self-hosted FastMCP Server (stdio & SSE)
│   ├── requirements.txt          # Python dependencies (fastapi, mcp, aiosqlite, etc.)
│   └── README.md                 # Python backend architecture & setup instructions
├── src/                          # React 19 Frontend Source
│   ├── components/               # Modular UI Components
│   │   ├── AlexaConsoleView.tsx  # Alexa+ Voice Terminal & MCP Sandbox
│   │   ├── AssistantDrawer.tsx   # Conversational Assistant Panel with MCP pills
│   │   ├── DashboardView.tsx     # Student Overview, Metrics, & Urgent Action Card
│   │   ├── Header.tsx            # Sticky header with voice toggles & quick actions
│   │   ├── SettingsView.tsx      # Timing preferences, AI engine status, JSON export
│   │   ├── Sidebar.tsx           # Navigation links with live badge indicators
│   │   ├── StudyPlannerView.tsx  # Pomodoro study timeline & Markdown export
│   │   ├── TaskCard.tsx          # Coursework card with completion, tags, & notes
│   │   ├── TaskModal.tsx         # Add/Edit task modal with form validation
│   │   └── TasksView.tsx         # Task manager with filters, search, & sorting
│   ├── context/
│   │   └── AppContext.tsx        # Central state, localStorage sync, speech synthesis
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces (Task, StudyPlan, McpToolCallLog)
│   ├── utils/                    # Decoupled Pure Business Logic & Unit Tests
│   │   ├── mcpProtocol.ts        # MCP tools manifest and local execution dispatcher
│   │   ├── nlpParser.ts          # Deterministic intent parser for offline student queries
│   │   ├── nlpParser.test.ts     # Unit tests for intent parsing
│   │   ├── sampleData.ts         # Realistic demo academic coursework dataset
│   │   ├── studyPlanner.ts       # Pomodoro timeline generator & time utilities
│   │   ├── studyPlanner.test.ts  # Unit tests for schedule generation & time conversion
│   │   ├── taskPrioritizer.ts    # Algorithmic urgency scoring & deadline calculation
│   │   └── taskPrioritizer.test.ts # Unit tests for urgency ranking & overdue filters
│   ├── App.tsx                   # Main layout container
│   ├── index.css                 # Tailwind CSS v4 styling & typography setup
│   └── main.tsx                  # React DOM entry point
├── .env.example                  # Environment variable template
├── .gitignore                    # Git ignore rules (node_modules, .env, dist, etc.)
├── index.html                    # HTML5 entry point with Plus Jakarta Sans & JetBrains Mono
├── metadata.json                 # AI Studio & Cloud Run capability descriptors
├── package.json                  # Node.js dependencies & scripts
├── server.ts                     # Full-stack Express server + Gemini proxy + MCP endpoints
├── tsconfig.json                 # TypeScript compiler options
└── vite.config.ts                # Vite 8 build & bundler configuration
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm** or **bun**
- *(Optional)* **Python 3.10+** (if running the standalone Python FastMCP server)
- *(Optional)* **Gemini API Key** (for server-side generative reasoning; local fallback works without it)

---

### Method A: Running the Full-Stack Node / Express App (Default)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/learnova-voice.git
   cd learnova-voice
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Edit `.env` and set your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY="your-actual-gemini-api-key"
   PORT=3000
   ```
   *Note: If no API key is provided, the application automatically engages the built-in Deterministic Engine with zero crashes or broken interactions.*

4. **Run Unit Tests**:
   ```bash
   npx tsx --test src/utils/*.test.ts
   ```
   *Expected output: `10/10 tests pass` verifying pure calculations, schedule generation, and NLP intent extraction.*

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

### Method B: Running the Standalone Python FastAPI & MCP Server

If you wish to test with the Python MCP ecosystem (Claude Desktop, Cursor, or local Python MCP clients):

1. **Navigate to the backend directory**:
   ```bash
   cd backend_mcp
   ```

2. **Create a virtual environment and install dependencies**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Start the FastAPI backend with SQLite**:
   ```bash
   python main.py
   # Serves REST API on http://127.0.0.1:8000
   # Interactive Swagger Docs: http://127.0.0.1:8000/docs
   ```

4. **Run the FastMCP Server**:
   ```bash
   # Run via FastMCP (stdio mode for Claude Desktop / Cursor):
   python mcp_server.py

   # Or inspect via the official MCP Inspector:
   npx @modelcontextprotocol/inspector python mcp_server.py
   ```

---

## 🔌 Connecting to Claude Desktop / Cursor (MCP Client)

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "learnova-voice": {
      "command": "python",
      "args": [
        "/path/to/learnova-voice/backend_mcp/mcp_server.py"
      ]
    }
  }
}
```

Or connect via **Streamable HTTP** to the running Express instance:
- **SSE Stream**: `http://localhost:3000/api/mcp/sse`
- **JSON-RPC Endpoint**: `http://localhost:3000/api/mcp/rpc`

---

## 🧪 Testing & Verification Checklist

- [x] **Unit Tests**: 10 unit tests pass in `node:test` runner.
- [x] **Type Safety**: Verified via `tsc --noEmit` with zero linting errors.
- [x] **Responsive Design**: Tested at 1440x900 (Desktop), 768x1024 (Tablet), and 390x844 (Mobile).
- [x] **Offline Capabilities**: Full task manipulation and study plan generation operational via `localStorage`.
- [x] **Audio Accessibility**: Integrated speech synthesis reads assistant responses aloud.
- [x] **Security**: API keys are isolated server-side; zero secrets exposed to client bundles.

---

## 🏆 Hackathon Context

This project was built for the **Amazon Developer Hackathon 2026** under the **Alexa+ & Model Context Protocol (MCP)** track. It demonstrates how modern conversational AI interfaces can move beyond static conversational chatbots to execute real, verifiable state mutations across student study workflows.

---

## 📄 License

Licensed under the [Apache License, Version 2.0](LICENSE).  
Copyright © 2026 Learnova Voice Contributors.
