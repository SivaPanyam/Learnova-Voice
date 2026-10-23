import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { getInitialSampleTasks } from './src/utils/sampleData.ts';
import { Task } from './src/types/index.ts';
import { executeMcpTool, MCP_TOOLS_MANIFEST } from './src/utils/mcpProtocol.ts';
import { parseStudentNaturalLanguage } from './src/utils/nlpParser.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-memory persistent task state for the session (seeded with realistic sample data)
let tasksDatabase: Task[] = getInitialSampleTasks();

// Gemini client initialization if API key is present
const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
let ai: GoogleGenAI | null = null;

if (hasGeminiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// -------------------------------------------------------------
// REST API Endpoints
// -------------------------------------------------------------

// System health & AI status
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Learnova Voice',
    hackathonTrack: 'Amazon Developer Hackathon 2026 - Alexa+ & MCP',
    geminiConnected: hasGeminiKey && ai !== null,
    geminiModel: 'gemini-3.8-flash',
    mcpProtocolVersion: '2025-11-25',
    totalTasks: tasksDatabase.length,
    timestamp: new Date().toISOString(),
  });
});

// Tasks CRUD
app.get('/api/tasks', (req: Request, res: Response) => {
  res.json(tasksDatabase);
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const body = req.body;
  const newTask: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: body.title || 'Untitled Task',
    subject: body.subject || 'General',
    category: body.category || 'assignment',
    dueDate: body.dueDate || new Date().toISOString().split('T')[0],
    dueTime: body.dueTime || '23:59',
    priority: body.priority || 'medium',
    estimatedMinutes: Number(body.estimatedMinutes) || 60,
    completed: false,
    isSample: false,
    notes: body.notes || '',
    createdAt: new Date().toISOString(),
  };

  tasksDatabase = [newTask, ...tasksDatabase];
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  let found = false;

  tasksDatabase = tasksDatabase.map(task => {
    if (task.id === id) {
      found = true;
      const wasCompleted = task.completed;
      const isNowCompleted = updates.completed !== undefined ? Boolean(updates.completed) : wasCompleted;
      return {
        ...task,
        ...updates,
        completed: isNowCompleted,
        completedAt: !wasCompleted && isNowCompleted ? new Date().toISOString() : task.completedAt,
      };
    }
    return task;
  });

  if (!found) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const updated = tasksDatabase.find(t => t.id === id);
  res.json(updated);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = tasksDatabase.length;
  tasksDatabase = tasksDatabase.filter(t => t.id !== id);

  if (tasksDatabase.length === initialLen) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  res.json({ success: true, id });
});

// Reset tasks database to initial sample data
app.post('/api/tasks/reset', (req: Request, res: Response) => {
  tasksDatabase = getInitialSampleTasks();
  res.json({ success: true, count: tasksDatabase.length, tasks: tasksDatabase });
});

// -------------------------------------------------------------
// MCP Tools Declarations for Gemini Function Calling
// -------------------------------------------------------------
const geminiTools = [
  {
    functionDeclarations: [
      {
        name: 'add_task',
        description: 'Creates a new student task or academic assignment.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Title of the task or assignment' },
            subject: { type: Type.STRING, description: 'Academic subject or course' },
            category: { type: Type.STRING, description: 'Category: exam, assignment, revision, reading, project, or other' },
            dueDate: { type: Type.STRING, description: 'Due date in YYYY-MM-DD format' },
            dueTime: { type: Type.STRING, description: 'Due time in HH:mm format' },
            priority: { type: Type.STRING, description: 'Priority: low, medium, high, or urgent' },
            estimatedMinutes: { type: Type.NUMBER, description: 'Estimated study duration in minutes' },
            notes: { type: Type.STRING, description: 'Helpful notes or syllabus info' },
          },
          required: ['title'],
        },
      },
      {
        name: 'list_tasks',
        description: 'Lists student tasks with optional filtering.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            filter: { type: Type.STRING, description: 'Filter: all, pending, completed, overdue' },
            subject: { type: Type.STRING, description: 'Optional subject filter' },
          },
        },
      },
      {
        name: 'complete_task',
        description: 'Marks a task as completed given its title or ID.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            idOrTitle: { type: Type.STRING, description: 'ID or title snippet of the task to complete' },
          },
          required: ['idOrTitle'],
        },
      },
      {
        name: 'prioritize_tasks',
        description: 'Orders student tasks by urgency, weight, and remaining days until deadline.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: 'generate_study_plan',
        description: 'Generates a time-blocked study schedule with Pomodoro breaks based on available study hours.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            availableHours: { type: Type.NUMBER, description: 'Number of available study hours today' },
            startTime: { type: Type.STRING, description: 'Starting time like 09:00' },
          },
          required: ['availableHours'],
        },
      },
    ],
  },
];

// -------------------------------------------------------------
// Conversational AI Assistant & Alexa+ Simulator Endpoint
// -------------------------------------------------------------
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  const { prompt, clientTasks, availableHours = 3 } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  // Use clientTasks if provided (keeps client in sync), else server tasks
  let activeTasks = Array.isArray(clientTasks) && clientTasks.length > 0 ? clientTasks : tasksDatabase;
  const toolLogs: any[] = [];
  let generatedPlan = null;

  // 1. Try Gemini API if connected
  if (ai) {
    try {
      const systemInstruction = `You are Learnova Voice, an intelligent AI study planning assistant built for the Amazon Developer Hackathon 2026 (Alexa+ track).
You help students organize coursework, prioritize deadlines, break down daunting assignments, and craft realistic study schedules.
Current date: ${new Date().toISOString().split('T')[0]}.
Current tasks in student's account:
${JSON.stringify(activeTasks.map(t => ({ id: t.id, title: t.title, subject: t.subject, dueDate: t.dueDate, priority: t.priority, completed: t.completed, minutes: t.estimatedMinutes })))}

When a student mentions adding, completing, prioritizing, or planning:
1. Always call the corresponding tool function (e.g., add_task, complete_task, prioritize_tasks, generate_study_plan).
2. Answer concisely, warmly, and encouragement-focused, suitable for an Alexa voice response.
3. Be realistic about time limits and encourage healthy cognitive breaks.`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          tools: geminiTools as any,
        },
      });

      const functionCalls = geminiResponse.functionCalls;
      let assistantText = geminiResponse.text || '';

      if (functionCalls && functionCalls.length > 0) {
        for (const fc of functionCalls) {
          const { result, updatedTasks, log } = executeMcpTool(fc.name || '', (fc.args || {}) as any, activeTasks);
          toolLogs.push(log);
          if (updatedTasks) {
            activeTasks = updatedTasks;
            tasksDatabase = updatedTasks; // sync server DB
          }
          if (result.studyPlan) {
            generatedPlan = result.studyPlan;
          }
        }

        // If Gemini didn't return text alongside function call, formulate clear summary
        if (!assistantText) {
          assistantText = toolLogs.map(l => l.result).join(' ');
        }
      }

      res.json({
        content: assistantText || 'Understood! I have updated your study tasks.',
        toolCalls: toolLogs,
        updatedTasks: activeTasks,
        studyPlan: generatedPlan,
        isFallback: false,
        model: 'gemini-3.8-flash',
      });
      return;
    } catch (geminiError) {
      console.warn('Gemini API call failed, falling back to local deterministic engine:', geminiError);
    }
  }

  // 2. Fallback deterministic execution
  const nlpResult = parseStudentNaturalLanguage(prompt, activeTasks, availableHours);

  for (const call of nlpResult.toolCalls) {
    const { result, updatedTasks, log } = executeMcpTool(call.tool, call.args, activeTasks);
    toolLogs.push(log);
    if (updatedTasks) {
      activeTasks = updatedTasks;
      tasksDatabase = updatedTasks;
    }
    if (result.studyPlan) {
      generatedPlan = result.studyPlan;
    }
  }

  res.json({
    content: nlpResult.responseText,
    toolCalls: toolLogs,
    updatedTasks: activeTasks,
    studyPlan: generatedPlan,
    isFallback: true,
    model: 'local-deterministic-engine',
  });
});

// -------------------------------------------------------------
// MCP Server Standard Protocol Endpoint (Streamable HTTP & JSON-RPC)
// -------------------------------------------------------------
app.get('/api/mcp/manifest', (req: Request, res: Response) => {
  res.json({
    name: 'learnova-voice-mcp',
    version: '1.0.0',
    protocolVersion: '2025-11-25',
    description: 'Model Context Protocol (MCP) server for Learnova Voice Alexa+ study planner',
    tools: MCP_TOOLS_MANIFEST,
  });
});

app.post('/api/mcp/rpc', (req: Request, res: Response) => {
  const { jsonrpc = '2.0', id = 1, method, params = {} } = req.body;

  if (method === 'tools/list') {
    res.json({
      jsonrpc,
      id,
      result: { tools: MCP_TOOLS_MANIFEST },
    });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    const { result, updatedTasks, log } = executeMcpTool(name, args || {}, tasksDatabase);
    if (updatedTasks) {
      tasksDatabase = updatedTasks;
    }

    res.json({
      jsonrpc,
      id,
      result: {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
        isError: !result.success,
      },
    });
    return;
  }

  res.status(404).json({
    jsonrpc,
    id,
    error: {
      code: -32601,
      message: `Method ${method} not found`,
    },
  });
});

// Streamable HTTP / SSE endpoint for real-time MCP connections
app.get('/api/mcp/sse', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`event: endpoint\ndata: ${JSON.stringify({ endpoint: '/api/mcp/rpc' })}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

// -------------------------------------------------------------
// Dev & Production Vite Middleware Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Learnova Voice server running on http://localhost:${PORT}`);
    console.log(`Gemini status: ${hasGeminiKey ? 'CONNECTED (gemini-3.8-flash)' : 'LOCAL FALLBACK ACTIVE'}`);
    console.log(`MCP Endpoint: http://localhost:${PORT}/api/mcp/rpc`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
});
