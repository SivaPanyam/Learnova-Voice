import React, { useState } from 'react';
import { 
  CalendarClock, 
  Sparkles, 
  Coffee, 
  CheckCircle2, 
  Clock, 
  Download, 
  RefreshCw, 
  Flame,
  Check,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StudyBlock } from '../types';

export const StudyPlannerView: React.FC = () => {
  const { 
    tasks, 
    currentPlan, 
    setCurrentPlan, 
    settings, 
    updateSettings, 
    generatePlan 
  } = useApp();

  const [availableHours, setAvailableHours] = useState(settings.availableDailyHours);
  const [startTime, setStartTime] = useState(settings.preferredStartTime);
  const [completedBlockIds, setCompletedBlockIds] = useState<Set<string>>(new Set());

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      availableDailyHours: Number(availableHours),
      preferredStartTime: startTime,
    });
    const newPlan = generatePlan(Number(availableHours), startTime);
    setCurrentPlan(newPlan);
  };

  const toggleBlockComplete = (id: string) => {
    setCompletedBlockIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedBlocksCount = currentPlan?.blocks.filter(b => completedBlockIds.has(b.id)).length || 0;
  const totalBlocks = currentPlan?.blocks.length || 0;
  const blockProgress = totalBlocks > 0 ? Math.round((completedBlocksCount / totalBlocks) * 100) : 0;

  const exportScheduleMarkdown = () => {
    if (!currentPlan) return;
    const lines = [
      `# Learnova Voice — Daily Study Schedule`,
      `Date: ${currentPlan.date}`,
      `Planned Study Duration: ${Math.round((currentPlan.totalPlannedMinutes / 60) * 10) / 10} hours`,
      `Focus Score: ${currentPlan.focusScore}/100`,
      ``,
      `## Timeline`,
      ...currentPlan.blocks.map(b => 
        b.type === 'break'
          ? `- ☕ **${b.startTime} - ${b.endTime}** [Break]: ${b.taskTitle}`
          : `- 🎯 **${b.startTime} - ${b.endTime}** [${b.subject}]: ${b.taskTitle} (${b.durationMinutes}m)`
      ),
      ``,
      `Generated with Learnova Voice for Amazon Developer Hackathon 2026.`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learnova-study-plan-${currentPlan.date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Personalized Study Schedule Generator</h2>
              <p className="text-xs text-slate-500">
                Optimized with cognitive interval pacing and automated Pomodoro break insertion.
              </p>
            </div>
          </div>

          {currentPlan && (
            <button
              type="button"
              onClick={exportScheduleMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors self-start md:self-auto"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Markdown</span>
            </button>
          )}
        </div>

        {/* Generator Form */}
        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Available Study Hours */}
          <div>
            <label htmlFor="planner-hours" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Available Study Time
            </label>
            <div className="flex items-center gap-2">
              <input
                id="planner-hours"
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={availableHours}
                onChange={e => setAvailableHours(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Hours</span>
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="planner-starttime" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Start Time
            </label>
            <input
              id="planner-starttime"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Work Block Pacing */}
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pacing Strategy
            </span>
            <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
              50m Work + 10m Break
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Plan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Plan Metrics Bar */}
      {currentPlan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Planned Study</span>
              <p className="text-lg font-extrabold text-slate-900">
                {Math.round((currentPlan.totalPlannedMinutes / 60) * 10) / 10} hrs
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Scheduled Rest</span>
              <p className="text-lg font-extrabold text-slate-900">
                {currentPlan.totalBreakMinutes} mins
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Focus Score</span>
              <p className="text-lg font-extrabold text-indigo-600">
                {currentPlan.focusScore}/100
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Blocks Completed</span>
              <p className="text-lg font-extrabold text-emerald-600">
                {completedBlocksCount}/{totalBlocks} ({blockProgress}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Scheduled Study Blocks</h3>
            <p className="text-xs text-slate-500">
              Click any block to check off your completed study intervals during the day.
            </p>
          </div>
          {totalBlocks > 0 && (
            <div className="w-48 bg-slate-100 h-2 rounded-full overflow-hidden self-start sm:self-auto">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${blockProgress}%` }}
              />
            </div>
          )}
        </div>

        {currentPlan && currentPlan.blocks.length > 0 ? (
          <div className="relative border-l-2 border-indigo-100 ml-4 sm:ml-6 space-y-6">
            {currentPlan.blocks.map((block, idx) => {
              const isCompleted = completedBlockIds.has(block.id);
              const isBreak = block.type === 'break';

              return (
                <div key={block.id || idx} className="relative pl-6 sm:pl-8 group">
                  {/* Timeline Node Point */}
                  <button
                    type="button"
                    onClick={() => toggleBlockComplete(block.id)}
                    aria-label={`Mark block ${block.taskTitle} as ${isCompleted ? 'incomplete' : 'complete'}`}
                    className={`
                      absolute -left-[17px] top-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer
                      ${isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                        : isBreak
                          ? 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200'
                          : 'bg-white border-indigo-300 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50'}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isBreak ? (
                      <Coffee className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </button>

                  {/* Block Content Card */}
                  <div
                    onClick={() => toggleBlockComplete(block.id)}
                    className={`
                      p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer
                      ${isCompleted 
                        ? 'bg-slate-50/70 border-slate-200 opacity-70' 
                        : isBreak
                          ? 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'}
                    `}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-extrabold ${isBreak ? 'text-amber-700' : 'text-indigo-700'}`}>
                          {block.startTime} — {block.endTime}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {block.durationMinutes} minutes
                        </span>
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isBreak 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {isBreak ? 'Recovery Break' : block.subject}
                      </span>
                    </div>

                    <h4 className={`text-sm sm:text-base font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                      {block.taskTitle}
                    </h4>

                    {block.notes && (
                      <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                        {block.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-900">No study plan generated</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Regenerate Plan&quot; above or ask Alexa+ to create a schedule for your pending tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
