import React from 'react';
import { Menu, Plus, Bot, Mic, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC<{ onOpenMobileMenu: () => void; onOpenNewTask: () => void }> = ({
  onOpenMobileMenu,
  onOpenNewTask,
}) => {
  const { 
    activeTab, 
    tasks, 
    currentPlan, 
    setIsDrawerOpen, 
    settings, 
    updateSettings, 
    isSpeaking, 
    stopSpeaking,
    geminiConnected 
  } = useApp();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Student Study Dashboard';
      case 'tasks': return 'Coursework & Assignment Tasks';
      case 'planner': return 'Daily Study Plan & Timeline';
      case 'alexa': return 'Alexa+ Simulation & MCP Live Console';
      case 'settings': return 'Planner & Assistant Settings';
      default: return 'Learnova Voice';
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Track cognitive load, manage deadlines, and stay ahead of exams.';
      case 'tasks': return 'All coursework items, priority rankings, and estimated completion times.';
      case 'planner': return 'Pomodoro time-blocking with dedicated cognitive recovery breaks.';
      case 'alexa': return 'Simulate Alexa+ voice commands and inspect real-time Model Context Protocol tool logs.';
      case 'settings': return 'Configure study pacing, audio preferences, and demo environments.';
      default: return '';
    }
  };

  const overdueCount = tasks.filter(t => !t.completed && new Date(t.dueDate).getTime() < new Date().setHours(0,0,0,0)).length;

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Title area */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 truncate">
              <span className="truncate">{getTitle()}</span>
              {geminiConnected ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Gemini AI
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  Local Engine
                </span>
              )}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 hidden sm:block truncate">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
          {/* Overdue Badge if any */}
          {overdueCount > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>{overdueCount} Overdue</span>
            </div>
          )}

          {/* Focus Score pill */}
          {currentPlan && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
              <span>Focus Score:</span>
              <span className="text-indigo-900 font-extrabold">{currentPlan.focusScore}%</span>
            </div>
          )}

          {/* Voice Speech Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) {
                stopSpeaking();
              } else {
                updateSettings({ alexaVoiceEnabled: !settings.alexaVoiceEnabled });
              }
            }}
            aria-label={settings.alexaVoiceEnabled ? 'Mute Alexa voice output' : 'Enable Alexa voice output'}
            title={settings.alexaVoiceEnabled ? (isSpeaking ? 'Stop speaking' : 'Alexa voice enabled') : 'Alexa voice muted'}
            className={`p-2.5 rounded-xl border transition-all ${
              settings.alexaVoiceEnabled 
                ? isSpeaking
                  ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                  : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {settings.alexaVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Add Task Button */}
          <button
            type="button"
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Add Task</span>
          </button>

          {/* Alexa Assistant Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Alexa+ Assistant</span>
            <span className="sm:hidden">Alexa</span>
          </button>
        </div>
      </div>
    </header>
  );
};
