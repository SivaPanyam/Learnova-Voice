import { Task } from '../types';
import { prioritizeTaskList, getOverdueTasks } from './taskPrioritizer';
import { executeMcpTool, ToolExecutionResult } from './mcpProtocol';

export interface NlpParseResult {
  toolCalls: Array<{ tool: string; args: Record<string, any> }>;
  responseText: string;
  isFallback: boolean;
}

/**
 * Deterministic Natural Language Parser for student academic planning requests.
 * Used when Gemini API is not configured or as instant offline mode.
 */
export const parseStudentNaturalLanguage = (
  prompt: string,
  currentTasks: Task[],
  availableHours = 3
): NlpParseResult => {
  const p = prompt.toLowerCase().trim();
  const today = new Date();
  
  const getRelativeDateStr = (daysAhead: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  // 1. "I have an exam on Friday and two assignments due tomorrow. Help me plan."
  if (
    (p.includes('exam') && p.includes('assignments') && p.includes('plan')) ||
    (p.includes('exam on friday') || (p.includes('exam') && p.includes('due tomorrow')))
  ) {
    const toolCalls = [
      {
        tool: 'add_task',
        args: {
          title: 'Upcoming Friday Exam Comprehensive Revision',
          subject: 'Core Academic',
          category: 'exam',
          priority: 'urgent',
          dueDate: getRelativeDateStr(3),
          estimatedMinutes: 120,
          notes: 'Synthesized from voice command: prioritize high-yield exam chapters.',
        },
      },
      {
        tool: 'add_task',
        args: {
          title: 'Assignment 1 Submission Polish',
          subject: 'Major Course',
          category: 'assignment',
          priority: 'urgent',
          dueDate: getRelativeDateStr(1),
          estimatedMinutes: 60,
          notes: 'Due tomorrow. Complete proofs and final checks.',
        },
      },
      {
        tool: 'add_task',
        args: {
          title: 'Assignment 2 Submission Polish',
          subject: 'Elective Course',
          category: 'assignment',
          priority: 'high',
          dueDate: getRelativeDateStr(1),
          estimatedMinutes: 60,
          notes: 'Due tomorrow. Check formatting and references.',
        },
      },
      {
        tool: 'generate_study_plan',
        args: {
          availableHours: 4,
          startTime: '09:00',
        },
      },
    ];

    return {
      toolCalls,
      responseText: `I've created tasks for your 2 assignments due tomorrow and your Friday exam, and scheduled a balanced 4-hour study plan. We'll knock out the two urgent assignments first so you can dedicate deep uninterrupted focus to exam revision.`,
      isFallback: true,
    };
  }

  // 2. "Add a two-hour mathematics revision task for tomorrow."
  if (p.includes('add') && (p.includes('mathematics') || p.includes('math')) && p.includes('revision')) {
    // Check duration
    let duration = 120;
    if (p.includes('one-hour') || p.includes('1 hour') || p.includes('1-hour')) duration = 60;
    if (p.includes('two-hour') || p.includes('2 hour') || p.includes('2-hour')) duration = 120;
    if (p.includes('three-hour') || p.includes('3 hour')) duration = 180;

    return {
      toolCalls: [
        {
          tool: 'add_task',
          args: {
            title: 'Mathematics Comprehensive Revision',
            subject: 'Mathematics',
            category: 'revision',
            priority: 'high',
            dueDate: getRelativeDateStr(1),
            estimatedMinutes: duration,
            notes: 'Created via Learnova Voice command.',
          },
        },
      ],
      responseText: `Added a ${duration / 60}-hour Mathematics revision task scheduled for tomorrow with high priority.`,
      isFallback: true,
    };
  }

  // Generic Add Task
  if (p.startsWith('add ') || p.includes('create a task') || p.includes('new task')) {
    const isExam = p.includes('exam') || p.includes('quiz') || p.includes('midterm');
    const isOverdue = p.includes('yesterday');
    const isTomorrow = p.includes('tomorrow');
    const days = isOverdue ? -1 : isTomorrow ? 1 : 2;

    let minutes = 60;
    const matchMins = p.match(/(\d+)\s*(mins|min|minutes)/);
    const matchHours = p.match(/(\d+)\s*(h|hr|hrs|hours|hour)/);
    if (matchHours) minutes = parseInt(matchHours[1], 10) * 60;
    else if (matchMins) minutes = parseInt(matchMins[1], 10);

    const title = prompt.replace(/^(alexa,\s*)?(please\s*)?(add|create|schedule)\s*(a|an)?\s*/i, '').trim();

    return {
      toolCalls: [
        {
          tool: 'add_task',
          args: {
            title: title.length > 5 ? title.charAt(0).toUpperCase() + title.slice(1) : 'New Academic Task',
            subject: p.includes('physics') ? 'Physics' : p.includes('chemistry') ? 'Chemistry' : p.includes('cs') || p.includes('code') ? 'Computer Science' : 'General Study',
            category: isExam ? 'exam' : 'assignment',
            priority: isExam ? 'high' : 'medium',
            dueDate: getRelativeDateStr(days),
            estimatedMinutes: minutes,
          },
        },
      ],
      responseText: `Added task "${title}" estimated at ${minutes} minutes.`,
      isFallback: true,
    };
  }

  // 3. "Which task should I complete first?" / "What should I work on first?"
  if (p.includes('complete first') || p.includes('work on first') || p.includes('what should i do first') || p.includes('highest priority')) {
    const sorted = prioritizeTaskList(currentTasks.filter(t => !t.completed));
    if (sorted.length === 0) {
      return {
        toolCalls: [],
        responseText: `All caught up! You have no pending tasks on your study queue right now. Great job staying ahead!`,
        isFallback: true,
      };
    }

    const top = sorted[0];
    const isOverdue = new Date(top.dueDate).getTime() < new Date().setHours(0,0,0,0);
    const overdueWarning = isOverdue ? ' (⚠️ Attention: this task is already overdue!)' : '';

    return {
      toolCalls: [
        {
          tool: 'prioritize_tasks',
          args: {},
        },
      ],
      responseText: `You should complete "${top.title}" (${top.subject}) first${overdueWarning}. It is marked ${top.priority.toUpperCase()} priority with an estimated duration of ${top.estimatedMinutes} minutes, due on ${top.dueDate}. Tackling this first minimizes deadline pressure and clears your highest cognitive hurdle.`,
      isFallback: true,
    };
  }

  // 4. "Show me my overdue assignments." / "What's overdue?"
  if (p.includes('overdue') || p.includes('late assignments') || p.includes('missed deadlines')) {
    const overdue = getOverdueTasks(currentTasks);
    return {
      toolCalls: [
        {
          tool: 'list_tasks',
          args: { filter: 'overdue' },
        },
      ],
      responseText: overdue.length > 0
        ? `You have ${overdue.length} overdue task(s): ${overdue.map(t => `"${t.title}" (${t.subject}, due ${t.dueDate})`).join(', ')}. I recommend allocating an immediate recovery block today to submit them.`
        : `Good news! You don't have any overdue assignments. All your deadlines are on track!`,
      isFallback: true,
    };
  }

  // 5. "Mark the completed assignment as done." / "Mark [task] as done"
  if (p.includes('mark') && (p.includes('done') || p.includes('complete'))) {
    // Extract query if specified
    let target = '';
    if (p.includes('mark the completed assignment as done') || p.includes('mark completed assignment as done')) {
      const incomplete = currentTasks.filter(t => !t.completed);
      target = incomplete.length > 0 ? incomplete[0].id : '';
    } else {
      const match = p.match(/mark (?:the )?(.+?) as (?:done|complete)/i);
      target = match ? match[1] : '';
    }

    return {
      toolCalls: [
        {
          tool: 'complete_task',
          args: { idOrTitle: target || 'active' },
        },
      ],
      responseText: `Marking the task as complete and updating your study stats.`,
      isFallback: true,
    };
  }

  // 6. "Help me plan" / "Generate study plan" / "Study schedule"
  if (p.includes('plan') || p.includes('schedule') || p.includes('timeline')) {
    let hours = availableHours;
    const matchHours = p.match(/(\d+)\s*(?:hour|hours|h)/i);
    if (matchHours) hours = parseInt(matchHours[1], 10);

    return {
      toolCalls: [
        {
          tool: 'generate_study_plan',
          args: { availableHours: hours, startTime: '09:00' },
        },
      ],
      responseText: `I've generated an optimized ${hours}-hour study schedule factoring in your highest priority deadlines with 10-minute cognitive recovery breaks between sessions.`,
      isFallback: true,
    };
  }

  // Default fallback conversational reply
  return {
    toolCalls: [
      {
        tool: 'prioritize_tasks',
        args: {},
      },
    ],
    responseText: `I received your request: "${prompt}". I've reviewed your pending academic workload and aligned your study priority queue. You can ask me to add tasks, prioritize deadlines, or generate an hourly study plan!`,
    isFallback: true,
  };
};
