import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  Mic,
  Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AssistantDrawer: React.FC = () => {
  const { 
    isDrawerOpen, 
    setIsDrawerOpen, 
    messages, 
    sendAssistantMessage, 
    isAiProcessing, 
    geminiConnected,
    isSpeaking,
    stopSpeaking,
    settings,
    updateSettings 
  } = useApp();

  const [input, setInput] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isDrawerOpen) {
      scrollToBottom();
    }
  }, [messages, isDrawerOpen, isAiProcessing]);

  if (!isDrawerOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isAiProcessing) return;
    sendAssistantMessage(query, 'assistant_chat');
    if (!textToSend) setInput('');
  };

  const samplePrompts = [
    'I have an exam on Friday and two assignments due tomorrow. Help me plan.',
    'Which task should I complete first?',
    'Add a two-hour mathematics revision task for tomorrow.',
    'Show me my overdue assignments.',
    'Mark the completed assignment as done.',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="Learnova Voice Conversational Assistant"
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-900">Alexa+ Study Assistant</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  geminiConnected 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {geminiConnected ? 'Gemini 3.8 Connected' : 'Deterministic Engine'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Autonomous task actions via Model Context Protocol</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                else updateSettings({ alexaVoiceEnabled: !settings.alexaVoiceEnabled });
              }}
              title={settings.alexaVoiceEnabled ? 'Mute Alexa voice' : 'Enable Alexa voice'}
              aria-label={settings.alexaVoiceEnabled ? 'Mute Alexa voice readout' : 'Enable Alexa voice readout'}
              className={`p-2 rounded-xl transition-colors ${
                settings.alexaVoiceEnabled ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              {settings.alexaVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close assistant drawer"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map(msg => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs font-medium'
                      : 'bg-slate-100 text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Executed MCP Tools Section */}
                  {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                        Executed MCP Actions ({msg.toolCalls.length}):
                      </span>
                      {msg.toolCalls.map((call, idx) => {
                        const isExpanded = expandedLogId === `${msg.id}-${idx}`;
                        return (
                          <div
                            key={idx}
                            className="rounded-xl bg-white border border-slate-200 text-xs overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedLogId(isExpanded ? null : `${msg.id}-${idx}`)}
                              className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-slate-50 font-mono text-[11px]"
                            >
                              <span className="text-emerald-700 font-bold">
                                ✓ tools/{call.tool}
                              </span>
                              <div className="flex items-center gap-1 text-slate-400">
                                <span>{call.executionTimeMs || 6}ms</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-2.5 bg-slate-900 text-slate-200 font-mono text-[10px] space-y-1 border-t border-slate-200 overflow-x-auto">
                                <p className="text-slate-400 font-semibold">arguments:</p>
                                <pre className="text-cyan-300">{JSON.stringify(call.params, null, 2)}</pre>
                                <p className="text-slate-400 font-semibold pt-1">return:</p>
                                <pre className="text-emerald-400">{JSON.stringify(call.result, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                        Try asking:
                      </span>
                      {msg.suggestedActions.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(sug)}
                          className="w-full text-left p-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 text-xs font-medium text-indigo-700 transition-colors flex items-center justify-between group"
                        >
                          <span className="line-clamp-1">&ldquo;{sug}&rdquo;</span>
                          <Play className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 shrink-0 ml-1.5" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isAiProcessing && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-slate-100 text-xs text-slate-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span>Alexa is reasoning & invoking MCP tools...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills Bar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          {samplePrompts.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-[11px] font-medium text-slate-700 hover:text-indigo-700 transition-colors"
            >
              &ldquo;{prompt.slice(0, 35)}...&rdquo;
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-200 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isAiProcessing}
            placeholder="Ask Alexa+ (e.g. 'Which task should I complete first?')..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isAiProcessing}
            aria-label="Send message"
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
