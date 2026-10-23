import { Task } from '../types';

export const getInitialSampleTasks = (): Task[] => {
  const today = new Date();
  
  const formatDate = (daysOffset: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'task-sample-1',
      title: 'Operating Systems: Page Replacement Lab',
      subject: 'Computer Science',
      category: 'assignment',
      dueDate: formatDate(1), // Tomorrow
      dueTime: '17:00',
      priority: 'urgent',
      estimatedMinutes: 90,
      completed: false,
      isSample: true,
      notes: 'Implement FIFO and LRU caching simulators with benchmark plots.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'task-sample-2',
      title: 'Calculus III Midterm Exam Revision',
      subject: 'Mathematics',
      category: 'exam',
      dueDate: formatDate(3), // Friday/in 3 days
      dueTime: '09:00',
      priority: 'high',
      estimatedMinutes: 120,
      completed: false,
      isSample: true,
      notes: 'Review Green’s theorem, Stokes’ theorem, and practice 2025 exam questions.',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'task-sample-3',
      title: 'Physics II Problem Set: Electromagnetism',
      subject: 'Physics',
      category: 'assignment',
      dueDate: formatDate(-1), // Yesterday (overdue test case)
      dueTime: '23:59',
      priority: 'high',
      estimatedMinutes: 60,
      completed: false,
      isSample: true,
      notes: 'Maxwell equations derivations and cylindrical capacitance calculations.',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'task-sample-4',
      title: 'Comparative Literature: Hamlet vs King Lear Essay',
      subject: 'Literature',
      category: 'assignment',
      dueDate: formatDate(4),
      dueTime: '23:59',
      priority: 'medium',
      estimatedMinutes: 90,
      completed: false,
      isSample: true,
      notes: 'Thesis draft comparing moral decay and tragic blindness in Shakespearean drama.',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'task-sample-5',
      title: 'Distributed Systems: Raft Consensus Paper',
      subject: 'Computer Science',
      category: 'reading',
      dueDate: formatDate(6),
      dueTime: '12:00',
      priority: 'low',
      estimatedMinutes: 45,
      completed: false,
      isSample: true,
      notes: 'Highlight leader election and log replication safety invariants.',
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 'task-sample-6',
      title: 'Organic Chemistry: Lab Safety Protocols Quiz',
      subject: 'Chemistry',
      category: 'exam',
      dueDate: formatDate(-2),
      dueTime: '10:00',
      priority: 'medium',
      estimatedMinutes: 30,
      completed: true,
      completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      isSample: true,
      notes: 'Passed with 100% score.',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];
};
