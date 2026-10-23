import React, { useState } from 'react';
import { 
  Sliders, 
  Volume2, 
  Sparkles, 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  ShieldCheck, 
  Check, 
  FileCode,
  Radio,
  BookOpen
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    tasks, 
    currentPlan, 
    resetToSampleData, 
    clearAllTasks, 
    geminiConnected 
  } = useApp();

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const exportAllDataJson = () => {
    const payload = {
      app: 'Learnova Voice',
      version: '1.0.0-hackathon',
      exportDate: new Date().toISOString(),
      settings,
      currentPlan,
      tasks,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnova-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Study Planner & Assistant Settings</h2>
            <p className="text-xs text-slate-500">Customize study durations, speech output, and inspect backend architecture.</p>
          </div>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>Settings Saved</span>
          </span>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Study Timing Preferences */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Study Pacing & Timing Preferences</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="settings-daily-hours" className="block text-xs font-bold text-slate-700 mb-1.5">
                Default Daily Study Target (Hours)
              </label>
              <input
                id="settings-daily-hours"
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={settings.availableDailyHours}
                onChange={e => updateSettings({ availableDailyHours: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used as base capacity when generating daily schedules.</p>
            </div>

            <div>
              <label htmlFor="settings-start-time" className="block text-xs font-bold text-slate-700 mb-1.5">
                Preferred Study Starting Time
              </label>
              <input
                id="settings-start-time"
                type="time"
                value={settings.preferredStartTime}
                onChange={e => updateSettings({ preferredStartTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Initial time for morning/afternoon study blocks.</p>
            </div>

            <div>
              <label htmlFor="settings-work-block" className="block text-xs font-bold text-slate-700 mb-1.5">
                Pomodoro Focus Interval (Minutes)
              </label>
              <input
                id="settings-work-block"
                type="number"
                min="15"
                max="120"
                step="5"
                value={settings.pomodoroWorkMinutes}
                onChange={e => updateSettings({ pomodoroWorkMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Long tasks are automatically chunked into this size.</p>
            </div>

            <div>
              <label htmlFor="settings-break-block" className="block text-xs font-bold text-slate-700 mb-1.5">
                Cognitive Recovery Break (Minutes)
              </label>
              <input
                id="settings-break-block"
                type="number"
                min="5"
                max="30"
                step="5"
                value={settings.pomodoroBreakMinutes}
                onChange={e => updateSettings({ pomodoroBreakMinutes: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Automated hydration & stretch pause duration.</p>
            </div>
          </div>
        </div>

        {/* Alexa+ Voice Feedback Settings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-cyan-600" />
            <span>Alexa+ Voice Synthesis & Audio</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Alexa Voice Readout</span>
                <span className="text-xs text-slate-500">
                  Read assistant recommendations aloud using browser SpeechSynthesis.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.alexaVoiceEnabled}
                onChange={e => updateSettings({ alexaVoiceEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer">
              <div>
                <span className="text-sm font-bold text-slate-900 block">Sample Data Distinction Tag</span>
                <span className="text-xs text-slate-500">
                  Highlight initial demo tasks with a prominent SAMPLE badge.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.showSampleDataBadge}
                onChange={e => updateSettings({ showSampleDataBadge: e.target.checked })}
                className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* AI & MCP Architecture Status */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Model & MCP Protocol Status</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Conversational Engine</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${geminiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-sm font-bold text-slate-900">
                  {geminiConnected ? 'Gemini 3.8 Flash (Server-Side)' : 'Deterministic Local Engine'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {geminiConnected 
                  ? 'Secure server-side API proxy via Express /api/assistant/chat.' 
                  : 'Robust rule-based intent parser active with zero external API dependencies.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs text-slate-500 font-medium">Model Context Protocol</span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-900">Protocol v2025-11-25</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Streamable HTTP `/api/mcp/sse` and JSON-RPC 2.0 `/api/mcp/rpc` with 6 standard tools.
              </p>
            </div>
          </div>
        </div>

        {/* Data Persistence & Reset Controls */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Workload Data Management</span>
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportAllDataJson}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Workload & Plan JSON</span>
            </button>

            <button
              type="button"
              onClick={resetToSampleData}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-2 transition-colors border border-indigo-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset to Demo Sample Workload</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all tasks and your current study plan?')) {
                  clearAllTasks();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2 transition-colors border border-rose-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Data</span>
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            Save Pacing Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
