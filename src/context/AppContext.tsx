import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Task, StudyPlan, McpToolCallLog, AssistantMessage, StudentSettings } from '../types';
import { getInitialSampleTasks } from '../utils/sampleData';
import { prioritizeTaskList } from '../utils/taskPrioritizer';
import { generateDailyStudyPlan } from '../utils/studyPlanner';
import { executeMcpTool } from '../utils/mcpProtocol';
import { parseStudentNaturalLanguage } from '../utils/nlpParser';

interface AppContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentPlan: StudyPlan | null;
  setCurrentPlan: React.Dispatch<React.SetStateAction<StudyPlan | null>>;
  settings: StudentSettings;
  updateSettings: (newSettings: Partial<StudentSettings>) => void;
  messages: AssistantMessage[];
  mcpLogs: McpToolCallLog[];
  isAiProcessing: boolean;
  geminiConnected: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  activeTab: 'dashboard' | 'tasks' | 'planner' | 'alexa' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'planner' | 'alexa' | 'settings') => void;
  
  // Actions
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleCompleteTask: (id: string) => void;
  sendAssistantMessage: (prompt: string, source?: 'alexa_voice' | 'assistant_chat') => Promise<void>;
  generatePlan: (availableHours?: number, startTime?: string) => StudyPlan;
  resetToSampleData: () => void;
  clearAllTasks: () => void;
  speakText: (text: string) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
}

const STORAGE_KEY_TASKS = 'learnova_tasks_v1';
const STORAGE_KEY_SETTINGS = 'learnova_settings_v1';
const STORAGE_KEY_PLAN = 'learnova_plan_v1';

const defaultSettings: StudentSettings = {
  availableDailyHours: 3.5,
  preferredStartTime: '09:00',
  pomodoroWorkMinutes: 50,
  pomodoroBreakMinutes: 10,
  alexaVoiceEnabled: true,
  alexaWakeWordFeedback: true,
  showSampleDataBadge: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read tasks from localStorage', e);
    }
    return getInitialSampleTasks();
  });

  const [settings, setSettings] = useState<StudentSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...defaultSettings, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Could not read settings from localStorage', e);
    }
    return defaultSettings;
  });

  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAN);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read plan from localStorage', e);
    }
    // Generate initial plan from default tasks
    return generateDailyStudyPlan({
      tasks: getInitialSampleTasks(),
      availableHours: 3.5,
      startTime: '09:00',
    });
  });

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I'm Learnova Voice, your Alexa+ study planning assistant. I can help you prioritize upcoming exams and coursework, balance assignment deadlines, and craft realistic study schedules. Say "Alexa, help me plan" or choose one of the prompts below!`,
      timestamp: new Date().toISOString(),
      suggestedActions: [
        'I have an exam on Friday and two assignments due tomorrow. Help me plan.',
        'Which task should I complete first?',
        'Add a two-hour mathematics revision task for tomorrow.',
        'Show me my overdue assignments.',
      ],
    },
  ]);

  const [mcpLogs, setMcpLogs] = useState<McpToolCallLog[]>([]);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [geminiConnected, setGeminiConnected] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'planner' | 'alexa' | 'settings'>('dashboard');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (currentPlan) {
      localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(currentPlan));
    }
  }, [currentPlan]);

  // Check server status and sync tasks
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) {
          const data = await res.json();
          setGeminiConnected(data.geminiConnected);
        }
      } catch (err) {
        console.info('Running in standalone client mode, API fallback ready');
      }
    };
    fetchStatus();
  }, []);

  // Web Speech Synthesis
  const speakText = useCallback((text: string) => {
    if (!settings.alexaVoiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    // Clean text of markdown artifacts for voice
    const cleanText = text.replace(/[*_#`[\]()]/g, '').replace(/https?:\/\/\S+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Try to find a pleasant female English voice for Alexa feel
    const voices = window.speechSynthesis.getVoices();
    const alexaVoice = voices.find(v => (v.name.includes('Samantha') || v.name.includes('Google UK English Female') || v.name.includes('Natural') || v.name.includes('Female')) && v.lang.startsWith('en'));
    if (alexaVoice) {
      utterance.voice = alexaVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [settings.alexaVoiceEnabled]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Task actions
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      completed: false,
      isSample: false,
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [newTask, ...prev]);

    // Background notify server if available
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    }).catch(() => {});

    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));

    fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    fetch(`/api/tasks/${id}`, { method: 'DELETE' }).catch(() => {});
  }, []);

  const toggleCompleteTask = useCallback((id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const willComplete = !t.completed;
          if (willComplete) {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b'],
            });
          }
          const updated = {
            ...t,
            completed: willComplete,
            completedAt: willComplete ? new Date().toISOString() : undefined,
          };
          fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
          return updated;
        }
        return t;
      })
    );
  }, []);

  // Generate study plan
  const generatePlan = useCallback((availableHours?: number, startTime?: string): StudyPlan => {
    const hours = availableHours ?? settings.availableDailyHours;
    const time = startTime ?? settings.preferredStartTime;
    const plan = generateDailyStudyPlan({
      tasks,
      availableHours: hours,
      startTime: time,
      maxBlockDurationMinutes: settings.pomodoroWorkMinutes,
      breakDurationMinutes: settings.pomodoroBreakMinutes,
    });
    setCurrentPlan(plan);
    return plan;
  }, [tasks, settings]);

  // Conversational Assistant handler with real state updates
  const sendAssistantMessage = useCallback(async (promptText: string, source: 'alexa_voice' | 'assistant_chat' = 'assistant_chat') => {
    if (!promptText.trim()) return;

    const userMsg: AssistantMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsAiProcessing(true);

    try {
      // 1. Try server endpoint
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          clientTasks: tasks,
          availableHours: settings.availableDailyHours,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data.updatedTasks) && data.updatedTasks.length > 0) {
          setTasks(data.updatedTasks);
        }
        if (data.studyPlan) {
          setCurrentPlan(data.studyPlan);
        }
        if (Array.isArray(data.toolCalls)) {
          setMcpLogs(prev => [...data.toolCalls, ...prev]);
        }

        const assistantMsg: AssistantMessage = {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toISOString(),
          toolCalls: data.toolCalls,
        };

        setMessages(prev => [...prev, assistantMsg]);
        setIsAiProcessing(false);
        speakText(data.content);
        return;
      }
    } catch (err) {
      console.warn('Server chat call failed, executing local MCP pipeline:', err);
    }

    // 2. Client-side fallback pipeline (deterministic execution)
    const nlp = parseStudentNaturalLanguage(promptText, tasks, settings.availableDailyHours);
    let updatedTaskList = [...tasks];
    const executedLogs: McpToolCallLog[] = [];
    let localPlan: StudyPlan | null = null;

    for (const call of nlp.toolCalls) {
      const { result, updatedTasks, log } = executeMcpTool(call.tool, call.args, updatedTaskList);
      log.source = source;
      executedLogs.push(log);
      if (updatedTasks) {
        updatedTaskList = updatedTasks;
      }
      if (result.studyPlan) {
        localPlan = result.studyPlan;
      }
    }

    setTasks(updatedTaskList);
    if (localPlan) {
      setCurrentPlan(localPlan);
    }
    setMcpLogs(prev => [...executedLogs, ...prev]);

    const assistantMsg: AssistantMessage = {
      id: `msg-ai-${Date.now()}`,
      role: 'assistant',
      content: nlp.responseText,
      timestamp: new Date().toISOString(),
      toolCalls: executedLogs,
    };

    setMessages(prev => [...prev, assistantMsg]);
    speakText(nlp.responseText);
    setIsAiProcessing(false);
  }, [tasks, settings, speakText]);

  const resetToSampleData = useCallback(() => {
    const sample = getInitialSampleTasks();
    setTasks(sample);
    const plan = generateDailyStudyPlan({
      tasks: sample,
      availableHours: settings.availableDailyHours,
      startTime: settings.preferredStartTime,
    });
    setCurrentPlan(plan);
    fetch('/api/tasks/reset', { method: 'POST' }).catch(() => {});
  }, [settings]);

  const clearAllTasks = useCallback(() => {
    setTasks([]);
    setCurrentPlan(null);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<StudentSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        tasks,
        setTasks,
        currentPlan,
        setCurrentPlan,
        settings,
        updateSettings,
        messages,
        mcpLogs,
        isAiProcessing,
        geminiConnected,
        isDrawerOpen,
        setIsDrawerOpen,
        activeTab,
        setActiveTab,
        addTask,
        updateTask,
        deleteTask,
        toggleCompleteTask,
        sendAssistantMessage,
        generatePlan,
        resetToSampleData,
        clearAllTasks,
        speakText,
        isSpeaking,
        stopSpeaking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
