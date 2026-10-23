import { Task, TaskPriority } from '../types';

export const getPriorityWeight = (priority: TaskPriority): number => {
  switch (priority) {
    case 'urgent': return 40;
    case 'high': return 30;
    case 'medium': return 20;
    case 'low': return 10;
    default: return 15;
  }
};

export const getCategoryWeight = (category: string): number => {
  switch (category) {
    case 'exam': return 25;
    case 'assignment': return 15;
    case 'project': return 12;
    case 'revision': return 10;
    case 'reading': return 5;
    default: return 0;
  }
};

/**
 * Calculates days remaining until due date relative to reference date.
 * Negative number means overdue.
 */
export const getDaysRemaining = (dueDateStr: string, referenceDate: Date = new Date()): number => {
  const due = new Date(dueDateStr + 'T23:59:59');
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - ref.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculates urgency score (higher = should be done sooner)
 */
export const calculateUrgencyScore = (task: Task, referenceDate: Date = new Date()): number => {
  if (task.completed) {
    return -100;
  }

  const priorityScore = getPriorityWeight(task.priority);
  const categoryScore = getCategoryWeight(task.category);
  const daysLeft = getDaysRemaining(task.dueDate, referenceDate);

  let deadlineScore = 0;
  if (daysLeft < 0) {
    // Overdue: critical attention!
    deadlineScore = 60 + Math.min(Math.abs(daysLeft) * 5, 20);
  } else if (daysLeft === 0) {
    // Due today
    deadlineScore = 45;
  } else if (daysLeft === 1) {
    // Due tomorrow
    deadlineScore = 32;
  } else if (daysLeft <= 3) {
    deadlineScore = 20;
  } else if (daysLeft <= 7) {
    deadlineScore = 10;
  } else {
    deadlineScore = 2;
  }

  // Large tasks need an early start
  const durationFactor = task.estimatedMinutes >= 90 ? 8 : task.estimatedMinutes >= 60 ? 4 : 0;

  return priorityScore + categoryScore + deadlineScore + durationFactor;
};

/**
 * Sorts tasks by urgency score descending, completed tasks last.
 */
export const prioritizeTaskList = (tasks: Task[], referenceDate: Date = new Date()): Task[] => {
  const annotated = tasks.map(task => ({
    ...task,
    urgencyScore: calculateUrgencyScore(task, referenceDate),
  }));

  return annotated.sort((a, b) => {
    // Incomplete before completed
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Higher urgency score first
    return (b.urgencyScore ?? 0) - (a.urgencyScore ?? 0);
  });
};

/**
 * Filters tasks that are overdue
 */
export const getOverdueTasks = (tasks: Task[], referenceDate: Date = new Date()): Task[] => {
  return tasks.filter(t => !t.completed && getDaysRemaining(t.dueDate, referenceDate) < 0);
};

/**
 * Filters tasks due within N days (including today)
 */
export const getUpcomingDeadlines = (tasks: Task[], daysAhead = 7, referenceDate: Date = new Date()): Task[] => {
  return tasks.filter(t => {
    if (t.completed) return false;
    const days = getDaysRemaining(t.dueDate, referenceDate);
    return days >= 0 && days <= daysAhead;
  }).sort((a, b) => getDaysRemaining(a.dueDate, referenceDate) - getDaysRemaining(b.dueDate, referenceDate));
};
