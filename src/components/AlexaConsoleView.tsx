import React, { useState } from 'react';
import { 
  Radio, 
  Mic, 
  MicOff, 
  Terminal, 
  Sparkles, 
  Play, 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Cpu, 
  Volume2, 
  VolumeX,
  ExternalLink,
  Send
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MCP_TOOLS_MANIFEST, executeMcpTool } from '../utils/mcpProtocol';

export const AlexaConsoleView: React.FC = () => {
  const { 
    tasks, 
    setTasks,
    mcpLogs, 
    sendAssistantMessage, 
    isAiProcessing, 
    isSpeaking, 
    stopSpeaking,
    settings, 
    updateSettings, 
    geminiConnected 
  } = useApp();

  const [voiceQueryInput, setVoiceQueryInput] = useState('');
  const [selectedTool, setSelectedTool] = useState(MCP_TOOLS_MANIFEST[0].name);
  const [customToolArgs, setCustomToolArgs] = useState('{\n  "title": "Hackathon Demo Presentation Review",\n  "subject": "Computer Science",\n  "category": "assignment",\n  "priority": "urgent",\n  "estimatedMinutes": 45\n}');
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  const sampleVoiceIntents = [
    'Alexa, ask Learnova which task should I complete first?',
    'Alexa, add a two-hour mathematics revision task for tomorrow.',
    'Alexa, I have an exam on Friday and two assignments due tomorrow. Help me plan.',
    'Alexa, show me my overdue assignments.',
    'Alexa, mark the completed assignment as done.',
  ];

  const handleVoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceQueryInput.trim()) return;
    // Strip "Alexa, " if present for assistant
    const cleaned = voiceQueryInput.replace(/^alexa,?\s*(ask learnova to|ask learnova)?\s*/i, '').trim();
    sendAssistantMessage(cleaned, 'alexa_voice');
    setVoiceQueryInput('');
  };

  const handleRunCustomMcpTool = () => {
    try {
      const parsedArgs = JSON.parse(customToolArgs);
      const { result, updatedTasks, log } = executeMcpTool(selectedTool, parsedArgs, tasks);
      if (updatedTasks) {
        setTasks(updatedTasks);
      }
      setSandboxResult({
        status: result.success ? 'success' : 'error',
        executionTime: `${log.executionTimeMs || 8}ms`,
        tool: selectedTool,
        params: parsedArgs,
        result: result.data || result.message,
      });
    } catch (err: any) {
      setSandboxResult({
        status: 'error',
        error: `JSON parse error: ${err.message}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Alexa+ & MCP Protocol Header */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Simulated Alexa+ Hackathon Environment (Protocol v2025-11-25)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Alexa+ Voice & MCP Tool Integration
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Learnova Voice acts as an Alexa+ skill endpoint and self-hosted Model Context Protocol (MCP) server. Test simulated voice intents and inspect live JSON-RPC tool invocations below.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700/80 text-xs space-y-1">
              <span className="text-slate-400 block font-medium">MCP Streamable HTTP:</span>
              <span className="font-mono text-emerald-400 font-bold">/api/mcp/sse & /rpc</span>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700/80 text-xs space-y-1">
              <span className="text-slate-400 block font-medium">LLM Engine:</span>
              <span className="font-bold text-indigo-300">
                {geminiConnected ? 'Gemini 3.8 Flash' : 'Deterministic Engine'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Alexa Voice Simulation (Left) & Live MCP Log / Sandbox (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Alexa+ Voice Simulator Shell */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Alexa+ Voice Terminal</h3>
                  <p className="text-xs text-slate-500">Wake word utterance & speech feedback</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else updateSettings({ alexaVoiceEnabled: !settings.alexaVoiceEnabled });
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    settings.alexaVoiceEnabled
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  title="Toggle Alexa Speech Synthesis"
                >
                  {settings.alexaVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{settings.alexaVoiceEnabled ? 'Speech ON' : 'Speech Muted'}</span>
                </button>
              </div>
            </div>

            {/* Audio Wave Visualizer Simulation */}
            <div className="my-5 p-5 rounded-2xl bg-slate-900 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 h-10">
                {[40, 70, 30, 90, 60, 100, 45, 80, 50, 95, 35, 75, 60, 40].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${
                      isSpeaking || isAiProcessing
                        ? 'bg-cyan-400 animate-pulse'
                        : 'bg-slate-700'
                    }`}
                    style={{
                      height: isSpeaking || isAiProcessing ? `${h}%` : '20%',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-slate-300">
                {isSpeaking 
                  ? 'Alexa is speaking response audio...' 
                  : isAiProcessing 
                    ? 'Processing voice intent via MCP pipeline...' 
                    : 'Alexa+ standby. Ready for voice prompts.'}
              </p>
            </div>

            {/* Quick Trigger Chips */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Sample Voice Invocations
              </span>
              <div className="space-y-1.5">
                {sampleVoiceIntents.map((phrase, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const clean = phrase.replace(/^alexa,?\s*(ask learnova to|ask learnova)?\s*/i, '').trim();
                      sendAssistantMessage(clean, 'alexa_voice');
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-cyan-50/60 border border-slate-200/80 hover:border-cyan-300 text-xs font-medium text-slate-800 transition-all flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">&ldquo;{phrase}&rdquo;</span>
                    <Play className="w-3 h-3 text-slate-400 group-hover:text-cyan-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Input Form */}
          <form onSubmit={handleVoiceSubmit} className="pt-4 border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={voiceQueryInput}
              onChange={e => setVoiceQueryInput(e.target.value)}
              placeholder="Type simulated voice command (e.g. 'Alexa, plan 3 hours today')..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
            />
            <button
              type="submit"
              disabled={isAiProcessing || !voiceQueryInput.trim()}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Right: MCP Tools Manifest & Direct Invocation Sandbox */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">MCP Tool Sandbox</h3>
                <p className="text-xs text-slate-500">Directly execute tools defined in manifest</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
              6 Tools Active
            </span>
          </div>

          {/* Tool Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select MCP Tool
            </label>
            <select
              value={selectedTool}
              onChange={e => {
                const name = e.target.value;
                setSelectedTool(name);
                // Prepopulate realistic JSON args for selected tool
                if (name === 'add_task') {
                  setCustomToolArgs('{\n  "title": "Machine Learning Lab 3",\n  "subject": "CS",\n  "category": "assignment",\n  "priority": "urgent",\n  "estimatedMinutes": 60\n}');
                } else if (name === 'list_tasks') {
                  setCustomToolArgs('{\n  "filter": "pending"\n}');
                } else if (name === 'complete_task') {
                  setCustomToolArgs('{\n  "idOrTitle": "Machine Learning Lab 3"\n}');
                } else if (name === 'generate_study_plan') {
                  setCustomToolArgs('{\n  "availableHours": 4,\n  "startTime": "09:00"\n}');
                } else if (name === 'prioritize_tasks') {
                  setCustomToolArgs('{}');
                } else if (name === 'update_task') {
                  setCustomToolArgs('{\n  "id": "task-sample-1",\n  "priority": "urgent"\n}');
                }
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {MCP_TOOLS_MANIFEST.map(t => (
                <option key={t.name} value={t.name}>{t.name} — {t.description.slice(0, 40)}...</option>
              ))}
            </select>
          </div>

          {/* JSON Arguments Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tool Arguments (JSON)
            </label>
            <textarea
              rows={4}
              value={customToolArgs}
              onChange={e => setCustomToolArgs(e.target.value)}
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-300 bg-slate-900 text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Run Button */}
          <button
            type="button"
            onClick={handleRunCustomMcpTool}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Execute MCP Tool & Update State</span>
          </button>

          {/* Sandbox Execution Result */}
          {sandboxResult && (
            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 text-xs font-mono space-y-1.5 overflow-x-auto">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
                <span>Output [Status: {sandboxResult.status}]</span>
                <span>Latency: {sandboxResult.executionTime || '0ms'}</span>
              </div>
              <pre className="text-[11px] text-emerald-400 whitespace-pre-wrap">
                {JSON.stringify(sandboxResult.result || sandboxResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Real-Time MCP Tool Invocation Audit Stream */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Real-Time MCP Execution Audit Stream</h3>
              <p className="text-xs text-slate-500">Every voice action triggers real MCP tools on the underlying state</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {mcpLogs.length} Events Logged
          </span>
        </div>

        {mcpLogs.length > 0 ? (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {mcpLogs.map((log, idx) => (
              <div
                key={log.id || idx}
                className="p-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs font-mono flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">tools/{log.tool}</span>
                    <span className="text-slate-400 text-[10px]">[{log.source}]</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString()} ({log.executionTimeMs || 5}ms)
                  </span>
                </div>
                <div className="text-slate-300 text-[11px] bg-slate-950 p-2 rounded-lg overflow-x-auto">
                  <span className="text-slate-400">params: </span>
                  {JSON.stringify(log.params)}
                </div>
                <div className="text-emerald-300 text-[11px] bg-slate-950 p-2 rounded-lg overflow-x-auto">
                  <span className="text-slate-400">result: </span>
                  {typeof log.result === 'object' ? JSON.stringify(log.result) : String(log.result)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200/60">
            No MCP tool calls logged yet. Run a simulated voice prompt or execute a tool in the sandbox above!
          </div>
        )}
      </div>
    </div>
  );
};
