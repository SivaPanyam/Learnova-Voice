import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Task, TaskPriority } from '../types';
import { TaskCard } from './TaskCard';
import { prioritizeTaskList, getOverdueTasks, getDaysRemaining } from '../utils/taskPrioritizer';

interface TasksViewProps {
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenNewTask, onEditTask }) => {
  const { tasks, toggleCompleteTask, deleteTask, resetToSampleData } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'dueDate' | 'durationAsc' | 'durationDesc' | 'title'>('urgency');

  // Derive unique subjects
  const subjects = useMemo(() => {
    const list = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));
    return ['all', ...list];
  }, [tasks]);

  // Counts
  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;
  const overdueCount = getOverdueTasks(tasks).length;

  // Filter & Sort
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Status filter
    if (statusFilter === 'pending') {
      result = result.filter(t => !t.completed);
    } else if (statusFilter === 'completed') {
      result = result.filter(t => t.completed);
    } else if (statusFilter === 'overdue') {
      result = getOverdueTasks(result);
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      result = result.filter(t => t.subject.toLowerCase() === subjectFilter.toLowerCase());
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'urgency') {
      result = prioritizeTaskList(result);
    } else if (sortBy === 'dueDate') {
      result.sort((a, b) => getDaysRemaining(a.dueDate) - getDaysRemaining(b.dueDate));
    } else if (sortBy === 'durationAsc') {
      result.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
    } else if (sortBy === 'durationDesc') {
      result.sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [tasks, statusFilter, subjectFilter, priorityFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Sample data informational banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between gap-4 text-xs text-indigo-950">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            Tasks tagged with <span className="font-bold uppercase tracking-wider text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">SAMPLE</span> are realistic demo assignments. Tasks added via voice or the modal are marked as user-created.
          </span>
        </div>
        <button
          type="button"
          onClick={resetToSampleData}
          className="whitespace-nowrap px-3 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg font-semibold transition-colors shadow-xs"
        >
          Reset Demo Tasks
        </button>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Top Row: Search input & Add task button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by assignment title, course, or syllabus notes..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenNewTask}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Status tabs & Dropdown filters */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-2 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === 'overdue' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-600 hover:text-rose-700'
              }`}
            >
              Overdue ({overdueCount})
            </button>
          </div>

          {/* Secondary Filters & Sort */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Subject Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <select
                aria-label="Filter tasks by course"
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="all">All Courses</option>
                {subjects.filter(s => s !== 'all').map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <select
              aria-label="Filter tasks by priority level"
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                aria-label="Sort tasks by criteria"
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="urgency">Urgency Score (Smart Priority)</option>
                <option value="dueDate">Due Date (Earliest First)</option>
                <option value="durationAsc">Duration (Shortest First)</option>
                <option value="durationDesc">Duration (Longest First)</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Task List Rendering */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={toggleCompleteTask}
              onEdit={onEditTask}
              onDelete={deleteTask}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No tasks found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {searchQuery || statusFilter !== 'all' || subjectFilter !== 'all'
              ? 'Try adjusting your search criteria, clearing filters, or resetting demo data.'
              : 'Your study queue is clean! Add your upcoming exams and assignments to get started.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={onOpenNewTask}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
            >
              Add New Task
            </button>
            <button
              type="button"
              onClick={resetToSampleData}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200"
            >
              Load Demo Tasks
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
