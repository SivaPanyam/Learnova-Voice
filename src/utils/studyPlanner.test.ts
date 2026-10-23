import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDailyStudyPlan, minutesToTimeString, timeStringToMinutes } from './studyPlanner.ts';
import { Task } from '../types';

test('minutesToTimeString and timeStringToMinutes convert reversibly', () => {
  assert.equal(minutesToTimeString(540), '09:00');
  assert.equal(minutesToTimeString(630), '10:30');
  assert.equal(timeStringToMinutes('09:00'), 540);
  assert.equal(timeStringToMinutes('14:45'), 885);
});

test('generateDailyStudyPlan respects available study hours and allocates Pomodoro blocks', () => {
  const tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Calculus Review',
      subject: 'Math',
      category: 'exam',
      dueDate: '2026-10-24',
      priority: 'urgent',
      estimatedMinutes: 90,
      completed: false,
      createdAt: '2026-10-20T00:00:00Z',
    },
    {
      id: 'task-2',
      title: 'History Reading',
      subject: 'History',
      category: 'reading',
      dueDate: '2026-10-25',
      priority: 'medium',
      estimatedMinutes: 60,
      completed: false,
      createdAt: '2026-10-20T00:00:00Z',
    },
  ];

  // Request a 2-hour study plan (120 minutes focus)
  const plan = generateDailyStudyPlan({
    tasks,
    availableHours: 2,
    startTime: '09:00',
    maxBlockDurationMinutes: 50,
    breakDurationMinutes: 10,
  });

  assert.ok(plan.blocks.length >= 2, 'Should have multiple blocks');
  assert.equal(plan.blocks[0].startTime, '09:00');
  assert.equal(plan.blocks[0].type, 'focus');
  
  // Total planned focus time should not exceed 120 minutes
  assert.ok(plan.totalPlannedMinutes <= 120);
  assert.ok(plan.totalPlannedMinutes > 0);

  // Check that at least one break is scheduled
  const breakBlock = plan.blocks.find(b => b.type === 'break');
  assert.ok(breakBlock, 'Should include cognitive recovery break');
  assert.equal(breakBlock?.subject, 'Wellness');

  // Focus score should be healthy
  assert.ok(plan.focusScore >= 50 && plan.focusScore <= 100);
});
