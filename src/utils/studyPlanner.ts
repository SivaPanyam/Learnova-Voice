import { StudyBlock, StudyPlan, Task } from '../types';
import { prioritizeTaskList } from './taskPrioritizer';

export interface GeneratePlanOptions {
  tasks: Task[];
  availableHours: number;
  startTime?: string; // HH:mm format, defaults to "09:00"
  date?: string;      // YYYY-MM-DD
  maxBlockDurationMinutes?: number; // defaults to 50
  breakDurationMinutes?: number;    // defaults to 10
}

/**
 * Format minutes from midnight into 24-hour HH:mm string
 */
export const minutesToTimeString = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Parse HH:mm string into minutes from midnight
 */
export const timeStringToMinutes = (timeStr: string): number => {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

/**
 * Generates an optimized, realistic daily study plan fitting into available hours.
 */
export const generateDailyStudyPlan = (options: GeneratePlanOptions): StudyPlan => {
  const {
    tasks,
    availableHours,
    startTime = '09:00',
    date = new Date().toISOString().split('T')[0],
    maxBlockDurationMinutes = 50,
    breakDurationMinutes = 10,
  } = options;

  const totalAvailableMinutes = Math.max(30, Math.round(availableHours * 60));
  const sortedTasks = prioritizeTaskList(tasks.filter(t => !t.completed));

  const blocks: StudyBlock[] = [];
  const coveredTaskIds = new Set<string>();
  let currentClockMinutes = timeStringToMinutes(startTime);
  let accumulatedStudyMinutes = 0;
  let accumulatedBreakMinutes = 0;

  for (const task of sortedTasks) {
    if (accumulatedStudyMinutes >= totalAvailableMinutes) {
      break;
    }

    let remainingTaskMinutes = task.estimatedMinutes || 60;

    while (remainingTaskMinutes > 0 && accumulatedStudyMinutes < totalAvailableMinutes) {
      // Don't exceed available time budget
      const minutesBudgetLeft = totalAvailableMinutes - accumulatedStudyMinutes;
      const blockDuration = Math.min(remainingTaskMinutes, maxBlockDurationMinutes, minutesBudgetLeft);

      if (blockDuration < 15 && blocks.length > 0) {
        // Less than 15 mins leftover, fold or break early
        break;
      }

      const blockStart = minutesToTimeString(currentClockMinutes);
      currentClockMinutes += blockDuration;
      const blockEnd = minutesToTimeString(currentClockMinutes);

      blocks.push({
        id: `block-${blocks.length + 1}-${task.id}`,
        taskId: task.id,
        taskTitle: remainingTaskMinutes > maxBlockDurationMinutes
          ? `${task.title} (Part ${Math.ceil((task.estimatedMinutes - remainingTaskMinutes + blockDuration) / maxBlockDurationMinutes)})`
          : task.title,
        subject: task.subject,
        startTime: blockStart,
        endTime: blockEnd,
        durationMinutes: blockDuration,
        type: 'focus',
        completed: false,
        notes: task.notes,
      });

      accumulatedStudyMinutes += blockDuration;
      remainingTaskMinutes -= blockDuration;
      coveredTaskIds.add(task.id);

      // Add a Pomodoro break if more study time remains
      if (accumulatedStudyMinutes < totalAvailableMinutes && (remainingTaskMinutes > 0 || blocks.length % 2 === 0)) {
        const breakStart = minutesToTimeString(currentClockMinutes);
        currentClockMinutes += breakDurationMinutes;
        const breakEnd = minutesToTimeString(currentClockMinutes);

        blocks.push({
          id: `break-${blocks.length + 1}`,
          taskTitle: 'Cognitive Recovery Break (Hydrate & Stretch)',
          subject: 'Wellness',
          startTime: breakStart,
          endTime: breakEnd,
          durationMinutes: breakDurationMinutes,
          type: 'break',
          completed: false,
        });
        accumulatedBreakMinutes += breakDurationMinutes;
      }
    }
  }

  // Calculate focus score based on planned coverage and pacing
  const urgentCount = sortedTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
  const coveredUrgent = sortedTasks.filter(t => (t.priority === 'urgent' || t.priority === 'high') && coveredTaskIds.has(t.id)).length;
  const coverageRatio = urgentCount > 0 ? (coveredUrgent / urgentCount) : 1;
  const focusScore = Math.min(100, Math.round(50 + coverageRatio * 40 + (accumulatedStudyMinutes >= 120 ? 10 : 5)));

  const summary = `Generated a ${Math.round((accumulatedStudyMinutes / 60) * 10) / 10}h study schedule covering ${coveredTaskIds.size} high-priority tasks with ${accumulatedBreakMinutes}m of scheduled rest.`;

  return {
    id: `plan-${date}-${Date.now()}`,
    date,
    availableHours,
    blocks,
    totalPlannedMinutes: accumulatedStudyMinutes,
    totalBreakMinutes: accumulatedBreakMinutes,
    tasksCovered: Array.from(coveredTaskIds),
    focusScore,
    summary,
  };
};
