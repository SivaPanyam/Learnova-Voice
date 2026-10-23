import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStudentNaturalLanguage } from './nlpParser.ts';
import { Task } from '../types';

const sampleTasks: Task[] = [
  {
    id: 't-1',
    title: 'Operating Systems Lab',
    subject: 'Computer Science',
    category: 'assignment',
    dueDate: '2026-10-24',
    priority: 'urgent',
    estimatedMinutes: 90,
    completed: false,
    createdAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 't-2',
    title: 'Electromagnetism Problem Set',
    subject: 'Physics',
    category: 'assignment',
    dueDate: '2026-10-20', // Overdue
    priority: 'high',
    estimatedMinutes: 60,
    completed: false,
    createdAt: '2026-10-18T00:00:00Z',
  },
];

test('handles exam and two assignments prompt', () => {
  const result = parseStudentNaturalLanguage(
    'I have an exam on Friday and two assignments due tomorrow. Help me plan.',
    sampleTasks
  );

  assert.ok(result.toolCalls.length >= 3, 'Should dispatch add_task tools and generate plan');
  const addCalls = result.toolCalls.filter(c => c.tool === 'add_task');
  assert.equal(addCalls.length, 3);
  const planCall = result.toolCalls.find(c => c.tool === 'generate_study_plan');
  assert.ok(planCall);
  assert.match(result.responseText, /exam/i);
});

test('handles adding mathematics revision task for tomorrow', () => {
  const result = parseStudentNaturalLanguage(
    'Add a two-hour mathematics revision task for tomorrow.',
    sampleTasks
  );

  assert.equal(result.toolCalls.length, 1);
  assert.equal(result.toolCalls[0].tool, 'add_task');
  assert.equal(result.toolCalls[0].args.estimatedMinutes, 120);
  assert.equal(result.toolCalls[0].args.subject, 'Mathematics');
});

test('handles "Which task should I complete first?"', () => {
  const result = parseStudentNaturalLanguage(
    'Which task should I complete first?',
    sampleTasks
  );

  assert.match(result.responseText, /first/i);
  assert.ok(result.responseText.includes('Electromagnetism') || result.responseText.includes('Operating Systems'));
});

test('handles "Show me my overdue assignments"', () => {
  const result = parseStudentNaturalLanguage(
    'Show me my overdue assignments.',
    sampleTasks
  );

  assert.equal(result.toolCalls[0].tool, 'list_tasks');
  assert.equal(result.toolCalls[0].args.filter, 'overdue');
  assert.match(result.responseText, /overdue task/i);
});
