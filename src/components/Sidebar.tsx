import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  CalendarClock, 
  Radio, 
  Settings, 
  Sparkles,
  Bot,
  Volume2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC<{ isOpenMobile?: boolean; onCloseMobile?: () => void }> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const { activeTab, setActiveTab, tasks, geminiConnected, setIsDrawerOpen, isSpeaking } = useApp();

  const pendingCount = tasks.filter(t => !t.completed).length;
  const overdueCount = tasks.filter(t => !t.completed && new Date(t.dueDate).getTime() < new Date().setHours(0,0,0,0)).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks',
      label: 'My Tasks',
      icon: CheckSquare,
      badge: pendingCount > 0 ? (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${overdueCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
          {pendingCount}
        </span>
      ) : null,
    },
    {
      id: 'planner',
      label: 'Study Planner',
      icon: CalendarClock,
      badge: null,
    },
    {
      id: 'alexa',
      label: 'Alexa+ & MCP Console',
      icon: Radio,
      badge: (
        <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-emerald-100 text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelect = (id: any) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside
      aria-label="Sidebar navigation"
      className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between
        transition-transform duration-200 ease-in-out md:translate-x-0
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:static'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">Learnova</span>
                <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Voice
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Alexa+ Hackathon 2026</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge}
              </button>
            );
          })}
        </nav>

        {/* AI Assistant Quick Launcher Card */}
        <div className="p-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-800/40 border border-slate-700/60 shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold text-slate-200">
                  {geminiConnected ? 'Gemini 3.8 Connected' : 'Deterministic Fallback'}
                </span>
              </div>
              {isSpeaking && (
                <span className="flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  Speaking
                </span>
              )}
            </div>
            <p className="text-[12px] text-slate-400 mb-3 leading-relaxed">
              Ask Alexa+ to schedule exams, prioritize assignments, or plan today.
            </p>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20"
            >
              <Bot className="w-4 h-4" />
              <span>Talk to Alexa+ Assistant</span>
            </button>
          </div>
        </div>

        {/* MCP Protocol Status Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>MCP v2025-11-25</span>
          </div>
          <span className="font-mono text-slate-400">v1.0.0-hackathon</span>
        </div>
      </div>
    </aside>
  );
};
