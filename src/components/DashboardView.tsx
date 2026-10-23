import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  ArrowRight, 
  Bot, 
  Play, 
  Target, 
  BookOpen, 
  Flame,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { prioritizeTaskList, getOverdueTasks, getDaysRemaining } from '../utils/taskPrioritizer';

export const DashboardView: React.FC<{ onOpenNewTask: () => void }> = ({ onOpenNewTask }) => {
  const { 
    tasks, 
    currentPlan, 
    toggleCompleteTask, 
    sendAssistantMessage, 
    setIsDrawerOpen, 
    setActiveTab 
  } = useApp();

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const overdueTasks = getOverdueTasks(tasks);
  const prioritized = prioritizeTaskList(pendingTasks);

  const totalEstimatedMins = pendingTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalHours = Math.round((totalEstimatedMins / 60) * 10) / 10;

  const topTask = prioritized.length > 0 ? prioritized[0] : null;
  const completionPercentage = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0;

  const quickPrompts = [
    {
      title: 'Exam & Assignments Planning',
      prompt: 'I have an exam on Friday and two assignments due tomorrow. Help me plan.',
      desc: 'Smart multi-task intake & prioritization',
    },
    {
      title: 'Urgent Task Guidance',
      prompt: 'Which task should I complete first?',
      desc: 'Algorithmically find highest urgency work',
    },
    {
      title: 'Voice Add 2h Math Revision',
      prompt: 'Add a two-hour mathematics revision task for tomorrow.',
      desc: 'Natural language task creation',
    },
    {
      title: 'Inspect Overdue Work',
      prompt: 'Show me my overdue assignments.',
      desc: 'Instant deadline recovery scan',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Alexa+ Hackathon 2026 Student MVP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to conquer today&apos;s coursework?
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Learnova Voice balances assignments, schedules cognitive breaks, and prevents exam crunch using intelligent priority queueing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Ask Alexa+ to Plan</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewTask}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 active:scale-[0.98] text-white font-semibold text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Tasks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Tasks</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{pendingTasks.length}</span>
              {overdueTasks.length > 0 && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {overdueTasks.length} overdue
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">Total in workload queue</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Estimated Workload */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Workload</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900">{totalHours} hrs</span>
            </div>
            <span className="text-xs text-slate-400">{totalEstimatedMins} minutes required</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Progress Rate</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-600">{completionPercentage}%</span>
              <span className="text-xs text-slate-400">({completedTasks.length}/{tasks.length})</span>
            </div>
            {/* Progress bar */}
            <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Focus Score */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daily Focus Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-indigo-600">
                {currentPlan ? `${currentPlan.focusScore}/100` : '85/100'}
              </span>
            </div>
            <span className="text-xs text-slate-400">Paced with Pomodoro rest</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Mid Section: Recommended Next Step & Quick Voice Assistant Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Action Card (Takes 1 Col) */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                <Target className="w-3.5 h-3.5" />
                Recommended Next Step
              </span>
              <span className="text-xs text-slate-400 font-medium">Prioritizer Engine</span>
            </div>

            {topTask ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                    {topTask.subject}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    topTask.priority === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {topTask.priority.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {topTask.title}
                </h3>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {topTask.notes || 'High cognitive return. Tackling this now clears impending pressure.'}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 font-medium border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Est: {topTask.estimatedMinutes} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Due: {topTask.dueDate}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900">All caught up!</h4>
                <p className="text-xs text-slate-500">No pending tasks remaining. Great job!</p>
              </div>
            )}
          </div>

          {topTask && (
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleCompleteTask(topTask.id)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Completed</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('planner')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Schedule Block
              </button>
            </div>
          )}
        </div>

        {/* Quick Voice Assistant Prompts (Takes 2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Alexa+ Voice Study Prompts</h3>
                <p className="text-xs text-slate-500">Click any natural language command to execute directly through the assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('alexa')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>MCP Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickPrompts.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  sendAssistantMessage(item.prompt, 'assistant_chat');
                  setIsDrawerOpen(true);
                }}
                className="text-left p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50/60 border border-slate-200/80 hover:border-indigo-300 transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-indigo-700">{item.title}</span>
                  <Play className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xs font-semibold text-slate-800 mb-1 leading-snug line-clamp-2">
                  &ldquo;{item.prompt}&rdquo;
                </p>
                <span className="text-[11px] text-slate-500">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Today's Scheduled Study Plan Timeline Preview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Today&apos;s Study Schedule</h3>
              <p className="text-xs text-slate-500">
                {currentPlan ? currentPlan.summary : 'Generated timeline with Pomodoro intervals.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>Full Timeline Planner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {currentPlan && currentPlan.blocks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentPlan.blocks.slice(0, 4).map((block, idx) => (
              <div
                key={block.id || idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  block.type === 'break' 
                    ? 'bg-amber-50/50 border-amber-200/60' 
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className={block.type === 'break' ? 'text-amber-700' : 'text-indigo-700'}>
                    {block.startTime} - {block.endTime}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded font-semibold bg-white border border-slate-200 text-slate-600">
                    {block.durationMinutes}m {block.type}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                  {block.taskTitle}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {block.subject}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-slate-500 mb-2">No study plan generated yet for today.</p>
            <button
              type="button"
              onClick={() => setActiveTab('planner')}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
            >
              Generate Daily Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
