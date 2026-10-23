import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateUrgencyScore, prioritizeTaskList, getOverdueTasks, getDaysRemaining } from './taskPrioritizer.ts';
import { Task } from '../types';

const mockBaseDate = new Date('2026-10-23T12:00:00Z');

test('getDaysRemaining calculates correct relative day offsets', () => {
  const daysTomorrow = getDaysRemaining('2026-10-24', mockBaseDate);
  assert.equal(daysTomorrow, 1);

  const daysYesterday = getDaysRemaining('2026-10-22', mockBaseDate);
  assert.equal(daysYesterday, -1);

  const daysToday = getDaysRemaining('2026-10-23', mockBaseDate);
  assert.equal(daysToday, 0);
});

test('calculateUrgencyScore gives highest urgency to overdue & urgent tasks', () => {
  const overdueTask: Task = {
    id: 't-1',
    title: 'Overdue Physics Homework',
    subject: 'Physics',
    category: 'assignment',
    dueDate: '2026-10-22', // -1 day
    priority: 'urgent',
    estimatedMinutes: 60,
    completed: false,
    createdAt: '2026-10-20T00:00:00Z',
  };

  const distantTask: Task = {
    id: 't-2',
    title: 'Future Reading',
    subject: 'Literature',
    category: 'reading',
    dueDate: '2026-11-15',
    priority: 'low',
    estimatedMinutes: 30,
    completed: false,
    createdAt: '2026-10-20T00:00:00Z',
  };

  const scoreOverdue = calculateUrgencyScore(overdueTask, mockBaseDate);
  const scoreDistant = calculateUrgencyScore(distantTask, mockBaseDate);

  assert.ok(scoreOverdue > scoreDistant, `Overdue score (${scoreOverdue}) should be much higher than distant (${scoreDistant})`);
  assert.ok(scoreOverdue > 100);
});

test('prioritizeTaskList places uncompleted urgent tasks first, completed tasks last', () => {
  const tasks: Task[] = [
    {
      id: 't-low',
      title: 'Low priority reading',
      subject: 'History',
      category: 'reading',
      dueDate: '2026-10-30',
      priority: 'low',
      estimatedMinutes: 30,
      completed: false,
      createdAt: '2026-10-20T00:00:00Z',
    },
    {
      id: 't-completed',
      title: 'Completed Exam',
      subject: 'Math',
      category: 'exam',
      dueDate: '2026-10-24',
      priority: 'urgent',
      estimatedMinutes: 120,
      completed: true,
      createdAt: '2026-10-20T00:00:00Z',
    },
    {
      id: 't-urgent',
      title: 'Urgent Lab Tomorrow',
      subject: 'CS',
      category: 'assignment',
      dueDate: '2026-10-24',
      priority: 'urgent',
      estimatedMinutes: 90,
      completed: false,
      createdAt: '2026-10-20T00:00:00Z',
    },
  ];

  const prioritized = prioritizeTaskList(tasks, mockBaseDate);
  assert.equal(prioritized[0].id, 't-urgent', 'Highest urgency task must be first');
  assert.equal(prioritized[prioritized.length - 1].id, 't-completed', 'Completed task must be at the end');
});

test('getOverdueTasks correctly isolates tasks past due', () => {
  const tasks: Task[] = [
    {
      id: 't-overdue',
      title: 'Overdue task',
      subject: 'Physics',
      category: 'assignment',
      dueDate: '2026-10-20',
      priority: 'high',
      estimatedMinutes: 60,
      completed: false,
      createdAt: '2026-10-18T00:00:00Z',
    },
    {
      id: 't-ok',
      title: 'Due tomorrow',
      subject: 'Physics',
      category: 'assignment',
      dueDate: '2026-10-24',
      priority: 'high',
      estimatedMinutes: 60,
      completed: false,
      createdAt: '2026-10-18T00:00:00Z',
    },
  ];

  const overdue = getOverdueTasks(tasks, mockBaseDate);
  assert.equal(overdue.length, 1);
  assert.equal(overdue[0].id, 't-overdue');
});
