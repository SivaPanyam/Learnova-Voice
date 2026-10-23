import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  GraduationCap,
  FileText,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { Task, TaskPriority, TaskCategory } from '../types';
import { getDaysRemaining } from '../utils/taskPrioritizer';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const [showNotes, setShowNotes] = useState(false);

  const daysLeft = getDaysRemaining(task.dueDate);
  const isOverdue = !task.completed && daysLeft < 0;
  const isDueToday = !task.completed && daysLeft === 0;
  const isDueTomorrow = !task.completed && daysLeft === 1;

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">Medium</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">Low</span>;
    }
  };

  const getCategoryIcon = (category: TaskCategory) => {
    switch (category) {
      case 'exam': return <GraduationCap className="w-3.5 h-3.5 text-purple-600" />;
      case 'assignment': return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
      case 'revision': return <Sparkles className="w-3.5 h-3.5 text-cyan-600" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div
      className={`
        group relative rounded-2xl border transition-all duration-200 p-4 sm:p-5
        ${task.completed 
          ? 'bg-slate-50/70 border-slate-200 opacity-75' 
          : isOverdue 
            ? 'bg-rose-50/30 border-rose-200 shadow-sm hover:border-rose-300' 
            : 'bg-white border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-200'}
      `}
    >
      <div className="flex items-start gap-3.5">
        {/* Completion Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task.id)}
          aria-label={task.completed ? `Mark "${task.title}" as incomplete` : `Mark "${task.title}" as complete`}
          className={`
            mt-1 w-6 h-6 rounded-lg flex items-center justify-center border transition-all
            ${task.completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 bg-white'}
          `}
        >
          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Subject, Category, Priority, Sample Badge */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
              {getCategoryIcon(task.category)}
              <span>{task.subject}</span>
            </span>

            <span className="capitalize text-xs font-medium text-slate-500">
              • {task.category}
            </span>

            {getPriorityBadge(task.priority)}

            {task.isSample && (
              <span className="px-2 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                Sample
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-base font-bold tracking-tight text-slate-900 ${task.completed ? 'line-through text-slate-400' : ''}`}>
            {task.title}
          </h3>

          {/* Meta Info Row: Due Date, Duration, Overdue Alert */}
          <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
            {/* Due date badge */}
            <div className={`flex items-center gap-1.5 font-medium ${
              isOverdue 
                ? 'text-rose-600 font-bold' 
                : isDueToday 
                  ? 'text-amber-600 font-bold' 
                  : 'text-slate-600'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isOverdue 
                  ? `Overdue (${Math.abs(daysLeft)}d ago)` 
                  : isDueToday 
                    ? `Due Today (${task.dueTime || '23:59'})` 
                    : isDueTomorrow 
                      ? `Due Tomorrow` 
                      : `Due: ${task.dueDate}`}
              </span>
              {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1 text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{task.estimatedMinutes} mins ({Math.round((task.estimatedMinutes / 60) * 10) / 10}h)</span>
            </div>

            {/* Notes Toggle if notes exist */}
            {task.notes && (
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                aria-label="Toggle notes visibility"
                className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5 ml-auto"
              >
                <span>{showNotes ? 'Hide notes' : 'View notes'}</span>
                {showNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Expanded Notes Section */}
          {showNotes && task.notes && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-500 block mb-0.5">Instructions & Checklist:</span>
              {task.notes}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 self-start sm:self-center">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label={`Edit task "${task.title}"`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete task "${task.title}"`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
