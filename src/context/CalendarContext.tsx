import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Calendar, CalendarEvent, AppTask, TaskStatus, TaskPriority, AISummaryResult } from '../types/calendar';
import { INITIAL_CALENDARS, INITIAL_EVENTS, INITIAL_TASKS, parseICSContent, isEventExpired } from '../utils/calendarData';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  fetchGoogleCalendars,
  fetchGoogleCalendarEvents,
} from '../services/googleCalendar';

interface CalendarContextType {
  // Google Auth & Integration
  user: User | null;
  googleToken: string | null;
  isGoogleConnected: boolean;
  isLoadingGoogle: boolean;
  googleSyncError: string | null;
  loginWithGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;
  refreshGoogleData: () => Promise<void>;

  // Calendars & Events
  calendars: Calendar[];
  activeCalendarId: string;
  setActiveCalendarId: (id: string) => void;
  defaultCalendarId: string | null;
  setDefaultCalendar: (calendarId: string) => void;
  events: CalendarEvent[];
  tasks: AppTask[];
  activeTab: 'dashboard' | 'calendars' | 'tasks';
  setActiveTab: (tab: 'dashboard' | 'calendars' | 'tasks') => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  
  // Event & Calendar operations
  addCalendar: (name: string, color: string, description?: string) => void;
  updateCalendarColor: (calendarId: string, newColor: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  deleteEvent: (eventId: string) => void;
  importICS: (icsContent: string, calendarName?: string, calendarColor?: string) => number;
  
  // Duplication and Task operations
  duplicateEventToApp: (eventId: string, customPriority?: TaskPriority, customStatus?: TaskStatus) => AppTask;
  createTaskDirectly: (task: Omit<AppTask, 'id' | 'createdAt'>) => AppTask;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  finalizeAndRemoveTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<AppTask>) => void;
  deleteTask: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, text: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  applyAISummary: (taskId: string, analysis: AISummaryResult) => void;

  // Toast & Undo
  toast: { id: string; message: string; undoTask?: AppTask } | null;
  dismissToast: () => void;
  undoLastCompletion: () => void;
  historicalCompletedCount: number;

  // Selected modals
  selectedEventForDetail: CalendarEvent | null;
  setSelectedEventForDetail: (event: CalendarEvent | null) => void;
  selectedTaskForDetail: AppTask | null;
  setSelectedTaskForDetail: (task: AppTask | null) => void;
  dateForNewEvent: string | null;
  setDateForNewEvent: (date: string | null) => void;

  // Computed metrics
  nextUpcomingEvent: CalendarEvent | null;
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    completionRate: number;
  };
  isClonedInApp: (eventId: string) => boolean;
  isTaskExpired: (task: AppTask) => boolean;
  purgeExpiredTasks: () => number;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const STORAGE_KEY_CALENDARS = 'chronoflow_calendars_v2';
const STORAGE_KEY_DEFAULT_CAL = 'chronoflow_default_calendar_v1';
const STORAGE_KEY_EVENTS = 'chronoflow_events_v2';
const STORAGE_KEY_TASKS = 'chronoflow_tasks_v2';
const STORAGE_KEY_THEME = 'chronoflow_theme_v2';
const STORAGE_KEY_COMPLETED_COUNT = 'chronoflow_completed_count_v2';

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Historical completed count for metrics
  const [historicalCompletedCount, setHistoricalCompletedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETED_COUNT);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Toast notification state
  const [toast, setToast] = useState<{ id: string; message: string; undoTask?: AppTask } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const dismissToast = () => setToast(null);

  const undoLastCompletion = () => {
    if (toast?.undoTask) {
      const restored: AppTask = {
        ...toast.undoTask,
        status: 'in_progress',
      };
      setTasks(prev => [restored, ...prev]);
      setHistoricalCompletedCount(prev => {
        const next = Math.max(0, prev - 1);
        try {
          localStorage.setItem(STORAGE_KEY_COMPLETED_COUNT, String(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
      setToast(null);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(darkMode));
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendars' | 'tasks'>('dashboard');

  // Google Auth state
  const [user, setUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleSyncError, setGoogleSyncError] = useState<string | null>(null);

  // Default calendar for automatic event duplication
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DEFAULT_CAL);
    } catch {
      return null;
    }
  });

  // Calendars state
  const [calendars, setCalendars] = useState<Calendar[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CALENDARS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CALENDARS;
  });

  const [activeCalendarId, setActiveCalendarId] = useState<string>('all');

  // Events state
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EVENTS;
  });

  // Tasks state (excluding already expired ones)
  const [tasks, setTasks] = useState<AppTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed: AppTask[] = JSON.parse(saved);
        return parsed.filter(t => !isEventExpired(t.endDateTime, t.startDateTime, t.isAllDay));
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASKS;
  });

  // Selected modals
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<AppTask | null>(null);
  const [dateForNewEvent, setDateForNewEvent] = useState<string | null>(null);

  // Helper to check if a task or its source event has expired (ha vencido)
  const isTaskExpired = useCallback(
    (task: AppTask): boolean => {
      if (task.sourceEventId) {
        const srcEvt = events.find((e) => e.id === task.sourceEventId);
        if (srcEvt && isEventExpired(srcEvt.endDateTime, srcEvt.startDateTime, srcEvt.isAllDay)) {
          return true;
        }
      }
      return isEventExpired(task.endDateTime, task.startDateTime, task.isAllDay);
    },
    [events]
  );

  // Manual or programmatic purge of expired tasks from Kanban & Task List
  const purgeExpiredTasks = useCallback((): number => {
    let count = 0;
    setTasks((prev) => {
      const remaining = prev.filter((t) => {
        const expired = isTaskExpired(t);
        if (expired) count++;
        return !expired;
      });
      return remaining;
    });
    return count;
  }, [isTaskExpired]);

  // Automatic elimination of expired events from Kanban & Task List
  // The original event in 'events' is NEVER deleted from the calendar!
  useEffect(() => {
    const runPurge = () => {
      setTasks((prev) => {
        const remaining = prev.filter((t) => !isTaskExpired(t));
        if (remaining.length !== prev.length) {
          return remaining;
        }
        return prev;
      });
    };

    runPurge();
    const interval = setInterval(runPurge, 10000);
    return () => clearInterval(interval);
  }, [isTaskExpired]);

  // If a task modal is currently open and that task expires, close it
  useEffect(() => {
    if (selectedTaskForDetail && isTaskExpired(selectedTaskForDetail)) {
      setSelectedTaskForDetail(null);
    }
  }, [selectedTaskForDetail, isTaskExpired]);

  // Helper to clone an event into a task object
  const createClonedTaskFromEvent = (evt: CalendarEvent): AppTask => {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sourceEventId: evt.id,
      calendarId: evt.calendarId,
      calendarName: evt.calendarName,
      calendarColor: evt.calendarColor,
      title: evt.title,
      description: evt.description,
      location: evt.location,
      meetLink: evt.meetLink,
      startDateTime: evt.startDateTime,
      endDateTime: evt.endDateTime,
      isAllDay: evt.isAllDay,
      status: 'pending',
      priority: 'medium',
      tags: [evt.calendarName],
      notes: `Duplicado automáticamente desde el calendario predeterminado "${evt.calendarName}".`,
      subtasks: [
        { id: `sub-${Date.now()}-1`, text: 'Revisar objetivos del evento', completed: false },
        { id: `sub-${Date.now()}-2`, text: 'Acciones de seguimiento', completed: false },
      ],
      createdAt: new Date().toISOString(),
    };
  };

  // Sync Google Calendars and Events
  const syncGoogleCalendarData = useCallback(async (token: string) => {
    setIsLoadingGoogle(true);
    setGoogleSyncError(null);
    try {
      const gCalendars = await fetchGoogleCalendars(token);
      if (gCalendars.length === 0) {
        setGoogleSyncError('No se encontraron calendarios en tu cuenta de Google.');
        return;
      }

      setCalendars(gCalendars);
      setActiveCalendarId('all');

      // Auto-set first primary calendar as default if none set yet
      let activeDefCal = defaultCalendarId;
      if (!activeDefCal) {
        const primary = gCalendars.find(c => c.isPrimary) || gCalendars[0];
        if (primary) {
          activeDefCal = primary.id;
          setDefaultCalendarId(primary.id);
          localStorage.setItem(STORAGE_KEY_DEFAULT_CAL, primary.id);
        }
      }

      const eventsPromises = gCalendars.slice(0, 8).map((cal) =>
        fetchGoogleCalendarEvents(token, cal.id, cal.name, cal.color)
      );

      const eventArrays = await Promise.all(eventsPromises);
      const allGoogleEvents = eventArrays.flat();

      setEvents(allGoogleEvents);

      // Automatic duplication for default calendar events (excluding expired ones)
      if (activeDefCal) {
        setTasks((prevTasks) => {
          const existingSourceIds = new Set(prevTasks.map((t) => t.sourceEventId).filter(Boolean));
          const newClones: AppTask[] = [];

          for (const evt of allGoogleEvents) {
            if (
              evt.calendarId === activeDefCal &&
              !existingSourceIds.has(evt.id) &&
              !isEventExpired(evt.endDateTime, evt.startDateTime, evt.isAllDay)
            ) {
              newClones.push(createClonedTaskFromEvent(evt));
              existingSourceIds.add(evt.id);
            }
          }

          if (newClones.length > 0) {
            return [...newClones, ...prevTasks];
          }
          return prevTasks;
        });
      }
    } catch (err: any) {
      console.error('Error sincronizando con Google Calendar:', err);
      setGoogleSyncError(err?.message || 'Error al conectar con Google Calendar');
    } finally {
      setIsLoadingGoogle(false);
    }
  }, [defaultCalendarId]);

  // Set default calendar and automatically duplicate all its existing non-expired events!
  const setDefaultCalendar = (calendarId: string) => {
    setDefaultCalendarId(calendarId);
    try {
      localStorage.setItem(STORAGE_KEY_DEFAULT_CAL, calendarId);
    } catch (e) {
      console.error(e);
    }

    // Auto duplicate all non-expired events from this calendar that are not yet in tasks
    setTasks((prevTasks) => {
      const existingSourceIds = new Set(prevTasks.map((t) => t.sourceEventId).filter(Boolean));
      const eventsToClone = events.filter(
        (e) =>
          e.calendarId === calendarId &&
          !existingSourceIds.has(e.id) &&
          !isEventExpired(e.endDateTime, e.startDateTime, e.isAllDay)
      );

      if (eventsToClone.length === 0) return prevTasks;

      const newClones = eventsToClone.map((evt) => createClonedTaskFromEvent(evt));
      return [...newClones, ...prevTasks];
    });
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setGoogleToken(token);
        syncGoogleCalendarData(token);
      },
      () => {
        setUser(null);
        setGoogleToken(null);
      }
    );

    return () => unsubscribe();
  }, [syncGoogleCalendarData]);

  // Login handler
  const loginWithGoogle = async () => {
    setIsLoadingGoogle(true);
    setGoogleSyncError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setGoogleToken(result.accessToken);
        await syncGoogleCalendarData(result.accessToken);
      }
    } catch (err: any) {
      setGoogleSyncError(err?.message || 'Error durante el inicio de sesión con Google');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const logoutGoogle = async () => {
    await googleSignOut();
    setUser(null);
    setGoogleToken(null);
  };

  const refreshGoogleData = async () => {
    if (googleToken) {
      await syncGoogleCalendarData(googleToken);
    }
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CALENDARS, JSON.stringify(calendars));
    } catch (e) {
      console.error(e);
    }
  }, [calendars]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error(e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  const isClonedInApp = (eventId: string): boolean => {
    return tasks.some(t => t.sourceEventId === eventId && !isTaskExpired(t));
  };

  const addCalendar = (name: string, color: string, description?: string) => {
    const newCal: Calendar = {
      id: `cal-${Date.now()}`,
      name,
      color,
      description,
      isPrimary: false,
      selected: false,
    };
    setCalendars(prev => [...prev, newCal]);
  };

  const updateCalendarColor = (calendarId: string, newColor: string) => {
    setCalendars(prev =>
      prev.map(c => (c.id === calendarId ? { ...c, color: newColor } : c))
    );
    setEvents(prev =>
      prev.map(e => (e.calendarId === calendarId ? { ...e, calendarColor: newColor } : e))
    );
    setTasks(prev =>
      prev.map(t => (t.calendarId === calendarId ? { ...t, calendarColor: newColor } : t))
    );
  };

  // Add Event (with automatic duplication if created for default calendar and date is not expired!)
  const addEvent = (eventData: Omit<CalendarEvent, 'id'>): CalendarEvent => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
    };
    setEvents(prev => [newEvent, ...prev]);

    // Automatic duplication if belongs to default calendar and is not expired!
    // (Expired events are preserved in the calendar but not added to Kanban/Tasks)
    if (
      defaultCalendarId &&
      newEvent.calendarId === defaultCalendarId &&
      !isEventExpired(newEvent.endDateTime, newEvent.startDateTime, newEvent.isAllDay)
    ) {
      const autoTask = createClonedTaskFromEvent(newEvent);
      setTasks(prev => [autoTask, ...prev]);
    }

    return newEvent;
  };

  const deleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    if (selectedEventForDetail?.id === eventId) {
      setSelectedEventForDetail(null);
    }
  };

  // Import ICS content (with auto duplication of non-expired events if matches default calendar)
  const importICS = (icsContent: string, calendarName = 'Calendario Importado', calendarColor = '#06B6D4'): number => {
    const newCalId = `cal-imported-${Date.now()}`;
    const newCal: Calendar = {
      id: newCalId,
      name: calendarName,
      color: calendarColor,
      description: 'Importado desde archivo iCalendar (.ics)',
      isPrimary: false,
    };

    const parsedEvents = parseICSContent(icsContent, newCalId, calendarName, calendarColor);
    if (parsedEvents.length > 0) {
      setCalendars(prev => [...prev, newCal]);
      setEvents(prev => [...parsedEvents, ...prev]);
      setActiveCalendarId(newCalId);

      // Auto duplicate non-expired events if this was chosen as default
      if (defaultCalendarId === newCalId) {
        const newTasks = parsedEvents
          .filter(e => !isEventExpired(e.endDateTime, e.startDateTime, e.isAllDay))
          .map(e => createClonedTaskFromEvent(e));
        setTasks(prev => [...newTasks, ...prev]);
      }

      return parsedEvents.length;
    }
    return 0;
  };

  // Manual duplicate event
  const duplicateEventToApp = (
    eventId: string,
    customPriority: TaskPriority = 'medium',
    customStatus: TaskStatus = 'pending'
  ): AppTask => {
    const sourceEvt = events.find(e => e.id === eventId);
    if (!sourceEvt) throw new Error('Evento no encontrado');

    // Comprobar si el evento ha vencido:
    // Los eventos vencidos se conservan en el calendario pero no entran al Kanban ni a la Lista de tareas
    if (isEventExpired(sourceEvt.endDateTime, sourceEvt.startDateTime, sourceEvt.isAllDay)) {
      setToast({
        id: `toast-${Date.now()}`,
        message: `El evento "${sourceEvt.title}" ya ha vencido. Se conserva intacto en tu calendario pero no se añade al Kanban ni a la lista de tareas.`,
      });
      throw new Error('El evento ha vencido y no se puede añadir al Kanban ni a la Lista de tareas.');
    }

    const newTask: AppTask = {
      id: `task-${Date.now()}`,
      sourceEventId: sourceEvt.id,
      calendarId: sourceEvt.calendarId,
      calendarName: sourceEvt.calendarName,
      calendarColor: sourceEvt.calendarColor,
      title: sourceEvt.title,
      description: sourceEvt.description,
      location: sourceEvt.location,
      meetLink: sourceEvt.meetLink,
      startDateTime: sourceEvt.startDateTime,
      endDateTime: sourceEvt.endDateTime,
      isAllDay: sourceEvt.isAllDay,
      status: customStatus,
      priority: customPriority,
      tags: [sourceEvt.calendarName],
      notes: `Duplicado desde ${sourceEvt.calendarName}.`,
      subtasks: [
        { id: `sub-${Date.now()}-1`, text: 'Revisar objetivos del evento', completed: false },
        { id: `sub-${Date.now()}-2`, text: 'Acciones de seguimiento', completed: false },
      ],
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const createTaskDirectly = (taskData: Omit<AppTask, 'id' | 'createdAt'>): AppTask => {
    if (isEventExpired(taskData.endDateTime, taskData.startDateTime, taskData.isAllDay)) {
      setToast({
        id: `toast-${Date.now()}`,
        message: `La fecha de la tarea "${taskData.title}" ya ha vencido. Solo se admiten tareas y eventos vigentes en el Kanban y Lista de tareas.`,
      });
      throw new Error('La fecha ya ha vencido.');
    }

    const newTask: AppTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (status === 'completed') {
      const taskToComplete = tasks.find(t => t.id === taskId);
      if (!taskToComplete) return;

      // ELIMINAR LA DUPLICACIÓN: se elimina la tarea duplicada del flujo de la app
      // El evento original de Google Calendar o calendario local NO se elimina ni se modifica
      setTasks(prev => prev.filter(t => t.id !== taskId));

      // Incrementar contador histórico para estadísticas de completados
      setHistoricalCompletedCount(prev => {
        const next = prev + 1;
        try {
          localStorage.setItem(STORAGE_KEY_COMPLETED_COUNT, String(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      // Si el modal de detalles de la tarea estaba abierto, cerrarlo
      if (selectedTaskForDetail?.id === taskId) {
        setSelectedTaskForDetail(null);
      }

      // Notificación flotante con opción de deshacer y confirmación de que el original sigue intacto
      setToast({
        id: `toast-${Date.now()}`,
        message: `"${taskToComplete.title}" finalizado. Se ha eliminado la duplicación; el evento original permanece en tu calendario.`,
        undoTask: taskToComplete,
      });
      return;
    }

    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status };
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(prev => (prev ? { ...prev, status } : null));
    }
  };

  const finalizeAndRemoveTask = (taskId: string) => {
    updateTaskStatus(taskId, 'completed');
  };

  const updateTask = (taskId: string, updates: Partial<AppTask>) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, ...updates } : t))
    );
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(prev => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(null);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(prev => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          ),
        };
      });
    }
  };

  const addSubtask = (taskId: string, text: string) => {
    if (!text.trim()) return;
    const newSub: { id: string; text: string; completed: boolean } = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: text.trim(),
      completed: false,
    };

    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, newSub] } : t))
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(prev => (prev ? { ...prev, subtasks: [...prev.subtasks, newSub] } : null));
    }
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(prev =>
        prev ? { ...prev, subtasks: prev.subtasks.filter(s => s.id !== subtaskId) } : null
      );
    }
  };

  const applyAISummary = (taskId: string, analysis: AISummaryResult) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const existingTexts = new Set(t.subtasks.map(s => s.text.toLowerCase()));
          const newSubtasks = [...t.subtasks];
          for (const item of analysis.actionItems) {
            if (!existingTexts.has(item.toLowerCase())) {
              newSubtasks.push({
                id: `ai-sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                text: item,
                completed: false,
              });
            }
          }
          return {
            ...t,
            aiAnalysis: analysis,
            priority: analysis.suggestedPriority || t.priority,
            subtasks: newSubtasks,
          };
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(prev => {
        if (!prev) return null;
        return {
          ...prev,
          aiAnalysis: analysis,
          priority: analysis.suggestedPriority || prev.priority,
        };
      });
    }
  };

  const nextUpcomingEvent = useMemo(() => {
    const now = Date.now();
    const sorted = [...events].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );

    const upcoming = sorted.filter(e => {
      const end = new Date(e.endDateTime).getTime();
      return end >= now;
    });

    if (upcoming.length > 0) {
      return upcoming[0];
    }
    return sorted[sorted.length - 1] || null;
  }, [events]);

  const stats = useMemo(() => {
    const total = tasks.length + historicalCompletedCount;
    const completed = historicalCompletedCount;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      completionRate,
    };
  }, [tasks, historicalCompletedCount]);

  return (
    <CalendarContext.Provider
      value={{
        user,
        googleToken,
        isGoogleConnected: Boolean(user && googleToken),
        isLoadingGoogle,
        googleSyncError,
        loginWithGoogle,
        logoutGoogle,
        refreshGoogleData,
        calendars,
        activeCalendarId,
        setActiveCalendarId,
        defaultCalendarId,
        setDefaultCalendar,
        events,
        tasks,
        activeTab,
        setActiveTab,
        darkMode,
        toggleDarkMode,
        addCalendar,
        updateCalendarColor,
        addEvent,
        deleteEvent,
        importICS,
        duplicateEventToApp,
        createTaskDirectly,
        updateTaskStatus,
        finalizeAndRemoveTask,
        updateTask,
        deleteTask,
        toggleSubtask,
        addSubtask,
        deleteSubtask,
        applyAISummary,
        toast,
        dismissToast,
        undoLastCompletion,
        historicalCompletedCount,
        selectedEventForDetail,
        setSelectedEventForDetail,
        selectedTaskForDetail,
        setSelectedTaskForDetail,
        dateForNewEvent,
        setDateForNewEvent,
        nextUpcomingEvent,
        stats,
        isClonedInApp,
        isTaskExpired,
        purgeExpiredTasks,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
