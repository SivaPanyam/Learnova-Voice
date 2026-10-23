export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export type TaskCategory = 'exam' | 'assignment' | 'revision' | 'reading' | 'project' | 'other';

export interface Task {
  id: string;
  title: string;
  subject: string;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: TaskPriority;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  isSample?: boolean; // Clearly marks initial demo sample data
  notes?: string;
  urgencyScore?: number;
  createdAt: string;
}

export type StudyBlockType = 'focus' | 'break' | 'review';

export interface StudyBlock {
  id: string;
  taskId?: string;
  taskTitle: string;
  subject: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  durationMinutes: number;
  type: StudyBlockType;
  completed: boolean;
  notes?: string;
}

export interface StudyPlan {
  id: string;
  date: string;
  availableHours: number;
  blocks: StudyBlock[];
  totalPlannedMinutes: number;
  totalBreakMinutes: number;
  tasksCovered: string[];
  focusScore: number; // 0 - 100
  summary: string;
}

export interface McpToolCallLog {
  id: string;
  timestamp: string;
  tool: 'add_task' | 'list_tasks' | 'update_task' | 'complete_task' | 'prioritize_tasks' | 'generate_study_plan';
  params: Record<string, unknown>;
  result: unknown;
  status: 'success' | 'error';
  source: 'alexa_voice' | 'assistant_chat' | 'mcp_direct';
  executionTimeMs?: number;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolCalls?: McpToolCallLog[];
  suggestedActions?: string[];
  isVoiceSpoken?: boolean;
}

export interface StudentSettings {
  availableDailyHours: number;
  preferredStartTime: string; // e.g. "09:00"
  pomodoroWorkMinutes: number; // e.g. 50
  pomodoroBreakMinutes: number; // e.g. 10
  alexaVoiceEnabled: boolean;
  alexaWakeWordFeedback: boolean;
  showSampleDataBadge: boolean;
}
