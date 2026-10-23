import React, { useState, useEffect } from 'react';
import { X, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { Task, TaskCategory, TaskPriority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void;
  editingTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [category, setCategory] = useState<TaskCategory>('assignment');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string; estimatedMinutes?: string }>({});

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setSubject(editingTask.subject);
      setCategory(editingTask.category);
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime || '23:59');
      setPriority(editingTask.priority);
      setEstimatedMinutes(editingTask.estimatedMinutes);
      setNotes(editingTask.notes || '');
    } else {
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setTitle('');
      setSubject('Computer Science');
      setCategory('assignment');
      setDueDate(tomorrow.toISOString().split('T')[0]);
      setDueTime('23:59');
      setPriority('medium');
      setEstimatedMinutes(60);
      setNotes('');
    }
    setErrors({});
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { title?: string; dueDate?: string; estimatedMinutes?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Task title is required.';
    }
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required.';
    }
    if (!estimatedMinutes || estimatedMinutes < 5) {
      newErrors.estimatedMinutes = 'Estimated duration must be at least 5 minutes.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      title: title.trim(),
      subject: subject.trim(),
      category,
      dueDate,
      dueTime,
      priority,
      estimatedMinutes: Number(estimatedMinutes),
      notes: notes.trim(),
      isSample: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 id="task-modal-title" className="text-lg font-bold text-slate-900">
              {editingTask ? 'Edit Study Task' : 'Add New Task'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Task or Exam Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Calculus III Midterm Exam Revision"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-indigo-500'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Subject & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-subject" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject / Course
              </label>
              <input
                id="task-subject"
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="task-category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                id="task-category"
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white"
              >
                <option value="exam">Exam / Quiz</option>
                <option value="assignment">Assignment / Problem Set</option>
                <option value="revision">Revision / Review</option>
                <option value="reading">Required Reading</option>
                <option value="project">Project Milestone</option>
                <option value="other">Other Workload</option>
              </select>
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-duedate" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="task-duedate"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  errors.dueDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 focus:border-indigo-500'
                }`}
              />
              {errors.dueDate && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.dueDate}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="task-duetime" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Due Time
              </label>
              <input
                id="task-duetime"
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
            </div>
          </div>

          {/* Priority & Estimated Minutes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-priority" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Level
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white font-medium"
              >
                <option value="urgent">Urgent (Immediate attention)</option>
                <option value="high">High (High grade impact)</option>
                <option value="medium">Medium (Standard priority)</option>
                <option value="low">Low (Flexible timing)</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-duration" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Est. Duration (Minutes)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="task-duration"
                  type="number"
                  min="5"
                  step="5"
                  value={estimatedMinutes}
                  onChange={e => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                />
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
                  ({Math.round((estimatedMinutes / 60) * 10) / 10}h)
                </span>
              </div>
            </div>
          </div>

          {/* Notes / Syllabus details */}
          <div>
            <label htmlFor="task-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Study Notes / Checklist (Optional)
            </label>
            <textarea
              id="task-notes"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Chapters 4-6, review theorems and practice question set 3..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{editingTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
