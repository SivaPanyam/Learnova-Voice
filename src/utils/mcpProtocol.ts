import { Task, StudyPlan, McpToolCallLog } from '../types';
import { prioritizeTaskList, getOverdueTasks } from './taskPrioritizer';
import { generateDailyStudyPlan } from './studyPlanner';

/**
 * Tool definitions conforming to Model Context Protocol (MCP) spec (2025-11-25+)
 */
export const MCP_TOOLS_MANIFEST = [
  {
    name: 'add_task',
    description: 'Creates a new student task or academic assignment with title, subject, category, due date, estimated duration, and priority level.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title of the task or assignment, e.g. "Calculus III Midterm Exam Revision"'
        },
        subject: {
          type: 'string',
          description: 'Academic subject or course code, e.g. "Mathematics", "Computer Science"'
        },
        category: {
          type: 'string',
          enum: ['exam', 'assignment', 'revision', 'reading', 'project', 'other'],
          description: 'Category of the academic workload'
        },
        dueDate: {
          type: 'string',
          description: 'Due date in YYYY-MM-DD format (or relative descriptor)'
        },
        dueTime: {
          type: 'string',
          description: 'Optional due time in HH:mm format, e.g. "17:00"'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Importance and urgency of the task'
        },
        estimatedMinutes: {
          type: 'number',
          description: 'Estimated completion time in minutes (e.g. 60, 120)'
        },
        notes: {
          type: 'string',
          description: 'Optional extra instructions, syllabus chapters or notes'
        }
      },
      required: ['title']
    }
  },
  {
    name: 'list_tasks',
    description: 'Lists student tasks with optional filtering by status (completed, pending, overdue), subject, or priority.',
    parameters: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['all', 'pending', 'completed', 'overdue'],
          description: 'Filter state of tasks to retrieve'
        },
        subject: {
          type: 'string',
          description: 'Optional course/subject filter'
        }
      }
    }
  },
  {
    name: 'update_task',
    description: 'Updates properties of an existing task such as priority, due date, or estimated duration.',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The task ID or exact/approximate task title'
        },
        title: { type: 'string' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent']
        },
        dueDate: { type: 'string' },
        estimatedMinutes: { type: 'number' },
        completed: { type: 'boolean' }
      },
      required: ['id']
    }
  },
  {
    name: 'complete_task',
    description: 'Marks a task as completed given its ID or title match.',
    parameters: {
      type: 'object',
      properties: {
        idOrTitle: {
          type: 'string',
          description: 'The unique ID or title fragment of the task to mark as complete'
        }
      },
      required: ['idOrTitle']
    }
  },
  {
    name: 'prioritize_tasks',
    description: 'Calculates urgency scores for all pending tasks based on impending deadlines, academic weight, and estimated durations, and returns an ordered priority queue.',
    parameters: {
      type: 'object',
      properties: {
        referenceDate: {
          type: 'string',
          description: 'Optional ISO date string reference point (defaults to now)'
        }
      }
    }
  },
  {
    name: 'generate_study_plan',
    description: 'Generates a balanced daily study schedule with focus intervals and cognitive recovery breaks based on available study hours.',
    parameters: {
      type: 'object',
      properties: {
        availableHours: {
          type: 'number',
          description: 'Number of study hours available today (e.g. 2, 4, 6)'
        },
        startTime: {
          type: 'string',
          description: 'Target starting clock time in HH:mm format, e.g. "09:00"'
        }
      },
      required: ['availableHours']
    }
  }
];

/**
 * Execute MCP tool against in-memory task state
 */
export interface ToolExecutionContext {
  tasks: Task[];
  setTasks: (updater: (prev: Task[]) => Task[]) => void;
  availableHours?: number;
}

export interface ToolExecutionResult {
  success: boolean;
  tool: string;
  message: string;
  data?: unknown;
  updatedTasks?: Task[];
  studyPlan?: StudyPlan;
}

export const executeMcpTool = (
  toolName: string,
  args: Record<string, any>,
  currentTasks: Task[]
): { result: ToolExecutionResult; updatedTasks?: Task[]; log: McpToolCallLog } => {
  const startTs = Date.now();
  let updatedTasks: Task[] | undefined;
  let executionResult: ToolExecutionResult;

  try {
    switch (toolName) {
      case 'add_task': {
        const today = new Date().toISOString().split('T')[0];
        const newTask: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: args.title || 'Untitled Study Task',
          subject: args.subject || 'General Study',
          category: args.category || 'assignment',
          dueDate: args.dueDate || today,
          dueTime: args.dueTime || '23:59',
          priority: args.priority || 'medium',
          estimatedMinutes: Number(args.estimatedMinutes) || 60,
          completed: false,
          isSample: false, // User-created!
          notes: args.notes || '',
          createdAt: new Date().toISOString(),
        };

        updatedTasks = [newTask, ...currentTasks];
        executionResult = {
          success: true,
          tool: 'add_task',
          message: `Added task "${newTask.title}" (${newTask.estimatedMinutes}m, ${newTask.priority} priority, due ${newTask.dueDate})`,
          data: newTask,
        };
        break;
      }

      case 'list_tasks': {
        const filter = args.filter || 'all';
        let filtered = [...currentTasks];

        if (filter === 'pending') filtered = filtered.filter(t => !t.completed);
        else if (filter === 'completed') filtered = filtered.filter(t => t.completed);
        else if (filter === 'overdue') filtered = getOverdueTasks(filtered);

        if (args.subject) {
          filtered = filtered.filter(t => t.subject.toLowerCase().includes(args.subject.toLowerCase()));
        }

        executionResult = {
          success: true,
          tool: 'list_tasks',
          message: `Found ${filtered.length} tasks matching criteria (${filter})`,
          data: filtered,
        };
        break;
      }

      case 'complete_task': {
        const query = (args.idOrTitle || '').toLowerCase().trim();
        let targetId = '';

        // Match by exact ID or substring title
        const found = currentTasks.find(t => 
          t.id.toLowerCase() === query || 
          t.title.toLowerCase().includes(query) ||
          query.includes(t.title.toLowerCase())
        );

        if (!found) {
          // Fallback: pick the first incomplete urgent task if generic "the completed assignment"
          const fallback = currentTasks.find(t => !t.completed);
          if (fallback) {
            targetId = fallback.id;
          }
        } else {
          targetId = found.id;
        }

        if (!targetId) {
          executionResult = {
            success: false,
            tool: 'complete_task',
            message: `Could not find an active task matching "${args.idOrTitle}".`,
          };
          break;
        }

        let completedTitle = '';
        updatedTasks = currentTasks.map(t => {
          if (t.id === targetId) {
            completedTitle = t.title;
            return {
              ...t,
              completed: true,
              completedAt: new Date().toISOString(),
            };
          }
          return t;
        });

        executionResult = {
          success: true,
          tool: 'complete_task',
          message: `Marked "${completedTitle}" as completed. Great job!`,
          data: { id: targetId, title: completedTitle },
        };
        break;
      }

      case 'update_task': {
        const targetId = args.id;
        let matched = false;

        updatedTasks = currentTasks.map(t => {
          if (t.id === targetId || t.title.toLowerCase().includes(targetId.toLowerCase())) {
            matched = true;
            return {
              ...t,
              title: args.title ?? t.title,
              priority: args.priority ?? t.priority,
              dueDate: args.dueDate ?? t.dueDate,
              estimatedMinutes: args.estimatedMinutes !== undefined ? Number(args.estimatedMinutes) : t.estimatedMinutes,
              completed: args.completed !== undefined ? Boolean(args.completed) : t.completed,
            };
          }
          return t;
        });

        if (!matched) {
          executionResult = {
            success: false,
            tool: 'update_task',
            message: `Task with ID or title "${targetId}" not found.`,
          };
        } else {
          executionResult = {
            success: true,
            tool: 'update_task',
            message: `Updated task details successfully.`,
            data: updatedTasks.find(t => t.id === targetId),
          };
        }
        break;
      }

      case 'prioritize_tasks': {
        const sorted = prioritizeTaskList(currentTasks);
        executionResult = {
          success: true,
          tool: 'prioritize_tasks',
          message: `Prioritized ${sorted.length} tasks based on deadlines and course weight.`,
          data: sorted,
        };
        break;
      }

      case 'generate_study_plan': {
        const hours = Number(args.availableHours) || 3;
        const startTime = args.startTime || '09:00';
        const plan = generateDailyStudyPlan({
          tasks: currentTasks,
          availableHours: hours,
          startTime,
        });

        executionResult = {
          success: true,
          tool: 'generate_study_plan',
          message: plan.summary,
          data: plan,
          studyPlan: plan,
        };
        break;
      }

      default: {
        executionResult = {
          success: false,
          tool: toolName,
          message: `Unrecognized MCP tool: ${toolName}`,
        };
      }
    }
  } catch (err: any) {
    executionResult = {
      success: false,
      tool: toolName,
      message: `Error executing tool ${toolName}: ${err?.message || String(err)}`,
    };
  }

  const log: McpToolCallLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    tool: toolName as any,
    params: args,
    result: executionResult.data ?? executionResult.message,
    status: executionResult.success ? 'success' : 'error',
    source: 'assistant_chat',
    executionTimeMs: Date.now() - startTs,
  };

  return { result: executionResult, updatedTasks, log };
};
