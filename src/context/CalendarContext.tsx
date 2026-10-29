import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { Calendar, CalendarEvent, AppTask, TaskStatus, TaskPriority, AISummaryResult, AppNote, HabitItem } from '../types/calendar';
import { INITIAL_CALENDARS, INITIAL_EVENTS, INITIAL_TASKS, parseICSContent, isEventExpired } from '../utils/calendarData';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  fetchGoogleCalendars,
  fetchGoogleCalendarEvents,
  clearStoredAccessToken,
} from '../services/googleCalendar';
import {
  testConnection,
  subscribeToUserTasks,
  saveTaskToFirestore,
  batchSaveTasksToFirestore,
  deleteTaskFromFirestore,
  syncUserProfile,
  syncUserSettings,
  getUserSettings,
  subscribeToUserNotes,
  saveNoteToFirestore,
  deleteNoteFromFirestore,
} from '../services/firebase';
import {
  fetchGoogleTaskLists,
  fetchGoogleTasks,
  createGoogleTask,
  updateGoogleTask,
  deleteGoogleTask,
  GoogleTaskList,
} from '../services/googleTasks';
import {
  OrionNotificationItem,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationPermission,
  requestNotificationPermission,
  sendDesktopNotification,
  registerServiceWorker,
} from '../services/notificationService';
import { formatEventShortTime } from '../utils/calendarData';

registerServiceWorker();

interface GoogleTaskConfirmAction {
  type: 'complete' | 'delete';
  task: AppTask;
  listId: string;
}

interface CalendarContextType {
  // Google Auth & Integration
  user: User | null;
  googleToken: string | null;
  isGoogleConnected: boolean;
  isLoadingGoogle: boolean;
  googleSyncError: string | null;
  unauthorizedDomainForModal: string | null;
  setUnauthorizedDomainForModal: (domain: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  logoutGoogle: () => Promise<void>;
  refreshGoogleData: () => Promise<void>;

  // Cloud & Persistence
  isCloudSynced: boolean;

  // Google Tasks Integration
  googleTaskLists: GoogleTaskList[];
  activeGoogleTaskListId: string | null;
  setActiveGoogleTaskListId: (id: string | null) => void;
  isSyncingGoogleTasks: boolean;
  syncGoogleTasks: (listId?: string) => Promise<number>;
  createTaskInGoogleTasks: (title: string, notes?: string, due?: string, listId?: string) => Promise<AppTask>;
  pendingGoogleTaskConfirm: GoogleTaskConfirmAction | null;
  cancelGoogleTaskConfirm: () => void;
  executeGoogleTaskConfirm: () => Promise<void>;

  // Calendars & Events
  calendars: Calendar[];
  activeCalendarId: string;
  setActiveCalendarId: (id: string) => void;
  defaultCalendarId: string | null;
  setDefaultCalendar: (calendarId: string) => void;
  events: CalendarEvent[];
  tasks: AppTask[];
  activeTab: 'dashboard' | 'calendars' | 'tasks' | 'notes';
  setActiveTab: (tab: 'dashboard' | 'calendars' | 'tasks' | 'notes') => void;
  darkMode: boolean;
  toggleDarkMode: () => void;

  // Event & Calendar operations
  addCalendar: (name: string, color: string, description?: string) => void;
  updateCalendarColor: (calendarId: string, newColor: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
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

  // PRO Plan membership
  isProMember: boolean;
  setIsProMember: (isPro: boolean) => void;
  toggleProMembership: () => void;

  // Notes state & operations (PRO feature)
  notes: AppNote[];
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  addNote: (note: Omit<AppNote, 'id' | 'createdAt' | 'updatedAt'>) => AppNote;
  updateNote: (noteId: string, updates: Partial<AppNote>) => void;
  deleteNote: (noteId: string) => void;
  linkNoteToTask: (noteId: string, taskId?: string) => void;
  linkNoteToEvent: (noteId: string, eventId?: string) => void;
  getNotesForTask: (taskId: string) => AppNote[];
  getNotesForEvent: (eventId: string) => AppNote[];

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
  completedEventIds: string[];
  isEventCompleted: (eventId: string) => boolean;
  completeEvent: (eventId: string) => void;
  getLinkedTaskForEvent: (eventId: string) => AppTask | undefined;
  // Orion Workspace state
  isWorkspaceModalOpen: boolean;
  setIsWorkspaceModalOpen: (open: boolean) => void;
  currentApp: 'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms';
  setCurrentApp: (app: 'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms', options?: { immediate?: boolean }) => void;
  navigateToApp: (app: 'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms', options?: { immediate?: boolean }) => void;
  isAppTransitioning: boolean;
  transitionTarget: 'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms' | null;
  transitionProgress: number;

  upcomingEventsList: CalendarEvent[];
  changeEventPriority: (eventId: string, priority: TaskPriority) => void;

  // Hábitos (Habit Tracker)
  habits: HabitItem[];
  addHabit: (title: string, category?: string, color?: string) => HabitItem;
  toggleHabitDate: (habitId: string, dateStr: string) => void;
  deleteHabit: (habitId: string) => void;

  // Spotlight Universal Search
  isSpotlightOpen: boolean;
  setIsSpotlightOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Notification system
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (updates: Partial<NotificationSettings>) => void;
  notifications: OrionNotificationItem[];
  unreadNotificationCount: number;
  desktopPermission: NotificationPermission | 'unsupported';
  requestDesktopPermission: () => Promise<NotificationPermission | 'unsupported'>;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  triggerTestNotification: () => Promise<void>;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

const STORAGE_KEY_CALENDARS = 'orion_calendars_v3';
const STORAGE_KEY_DEFAULT_CAL = 'orion_default_calendar_v3';
const STORAGE_KEY_EVENTS = 'orion_events_v3';
const STORAGE_KEY_TASKS = 'orion_tasks_v3';
const STORAGE_KEY_THEME = 'orion_theme_v3';
const STORAGE_KEY_COMPLETED_COUNT = 'orion_completed_count_v3';
const STORAGE_KEY_COMPLETED_EVENTS = 'orion_completed_events_v3';
const STORAGE_KEY_PRO_MEMBER = 'orion_pro_member_v3';
const STORAGE_KEY_NOTES = 'orion_notes_v3';
const STORAGE_KEY_HABITS = 'orion_habits_v1';
const STORAGE_KEY_NOTIF_SETTINGS = 'orion_notif_settings_v1';
const STORAGE_KEY_NOTIFICATIONS = 'orion_notifications_v1';

const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'habit-1',
    title: 'Planificar el día y revisar tareas',
    category: 'Productividad',
    targetDaysPerWeek: 5,
    completedDates: [
      new Date(Date.now() - 86400000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
    ],
    color: '#3B82F6',
    streak: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-2',
    title: 'Revisar y procesar correo clave',
    category: 'Mail',
    targetDaysPerWeek: 5,
    completedDates: [
      new Date(Date.now() - 86400000).toISOString().split('T')[0],
    ],
    color: '#8B5CF6',
    streak: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'habit-3',
    title: 'Bloque de foco y lectura de notas',
    category: 'Foco',
    targetDaysPerWeek: 4,
    completedDates: [
      new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      new Date(Date.now() - 86400000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0],
    ],
    color: '#10B981',
    streak: 3,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_NOTES: AppNote[] = [
  {
    id: 'note-sample-1',
    title: 'Estrategia y Objetivos del Sprint',
    content: 'Revisar entregables de la semana, sincronizar prioridades con el equipo y verificar la integración de tareas vinculadas.',
    tags: ['Proyectos', 'Sprint'],
    color: '#3B82F6',
    isPinned: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-sample-2',
    title: 'Ideas y Automatizaciones para Tareas',
    content: '- Vinculación bidireccional entre notas y tareas del tablero Kanban.\n- Creación de subtareas con un clic desde notas.\n- Sincronización en la nube con Firestore.',
    tags: ['Ideas', 'Productividad'],
    color: '#8B5CF6',
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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

  // PRO Plan membership state
  const [isProMember, setIsProMember] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRO_MEMBER);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Notes state
  const [notes, setNotes] = useState<AppNote[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      if (saved) {
        const parsed: AppNote[] = JSON.parse(saved);
        return parsed.map((n) => ({
          ...n,
          tags: (n.tags || []).filter((t) => t.toUpperCase() !== 'PRO'),
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTES;
  });

  // Selected note ID for active note editor
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Save notes locally whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error(e);
    }
  }, [notes]);

  // Hábitos state & streak calculation
  const [habits, setHabits] = useState<HabitItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HABITS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_HABITS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits));
    } catch (e) {
      console.error(e);
    }
  }, [habits]);

  const calculateStreak = (dates: string[]): number => {
    if (!dates || dates.length === 0) return 0;
    const sorted = Array.from(new Set(dates)).sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!sorted.includes(today) && !sorted.includes(yesterday)) {
      return 0;
    }

    let currentStreak = 0;
    let checkDate = sorted.includes(today) ? new Date() : new Date(Date.now() - 86400000);

    for (let i = 0; i < 365; i++) {
      const formatted = checkDate.toISOString().split('T')[0];
      if (sorted.includes(formatted)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return currentStreak;
  };

  const addHabit = (title: string, category: string = 'General', color: string = '#3B82F6'): HabitItem => {
    const newHabit: HabitItem = {
      id: 'habit-' + Date.now(),
      title: title.trim(),
      category: category.trim() || 'General',
      targetDaysPerWeek: 5,
      completedDates: [],
      color,
      streak: 0,
      createdAt: new Date().toISOString(),
    };
    setHabits((prev) => [newHabit, ...prev]);
    return newHabit;
  };

  const toggleHabitDate = (habitId: string, dateStr: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(dateStr);
        const nextDates = exists
          ? h.completedDates.filter((d) => d !== dateStr)
          : [...h.completedDates, dateStr];
        return {
          ...h,
          completedDates: nextDates,
          streak: calculateStreak(nextDates),
        };
      })
    );
  };

  const deleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  // Spotlight Universal Search State & Shortcut
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Notification System State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIF_SETTINGS);
      if (saved) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_NOTIFICATION_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIF_SETTINGS, JSON.stringify(notificationSettings));
    } catch {}
  }, [notificationSettings]);

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings((prev) => ({ ...prev, ...updates }));
  };

  const [notifications, setNotifications] = useState<OrionNotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    return getNotificationPermission();
  });

  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const requestDesktopPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    const perm = await requestNotificationPermission();
    setDesktopPermission(perm);
    if (perm === 'granted') {
      sendDesktopNotification({
        title: '🔔 Orion Notifications Activas',
        body: 'Notificaciones de escritorio habilitadas para eventos y tareas.',
        sound: notificationSettings.soundEnabled,
      });
      setToast({
        id: `toast-${Date.now()}`,
        message: '¡Avisos de escritorio activados!',
      });
    }
    return perm;
  };

  const triggerTestNotification = async () => {
    let perm = desktopPermission;
    if (perm === 'default') {
      perm = await requestDesktopPermission();
    }

    const testItem: OrionNotificationItem = {
      id: `notif-${Date.now()}`,
      title: '🔔 Notificación de prueba de Orion',
      body: 'El sistema de avisos de escritorio y sonido está funcionando con éxito.',
      timestamp: new Date().toISOString(),
      type: 'system',
      read: false,
    };
    setNotifications((prev) => [testItem, ...prev]);

    await sendDesktopNotification({
      title: '🔔 Orion Workspace',
      body: '¡Todo listo! Tu sistema de notificaciones está configurado y funcionando.',
      sound: notificationSettings.soundEnabled,
      onClick: () => {
        setIsNotificationCenterOpen(true);
      },
    });

    setToast({
      id: `toast-${Date.now()}`,
      message: 'Notificación de prueba enviada',
    });
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

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendars' | 'tasks' | 'notes'>('dashboard');

  // Google Auth state
  const [user, setUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleSyncError, setGoogleSyncError] = useState<string | null>(null);
  const [unauthorizedDomainForModal, setUnauthorizedDomainForModal] = useState<string | null>(null);

  // Helper to determine initial app based on URL path (/mail, /calendar, /tasks, /drive, /privacy, /terms, /)
  const getInitialApp = (): 'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms' => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname.toLowerCase();
      if (
        pathname === '/privacy' ||
        pathname === '/privacy-policy' ||
        pathname.includes('privacidad') ||
        pathname.includes('privacy')
      ) {
        return 'privacy';
      }
      if (
        pathname === '/terms' ||
        pathname === '/terms-of-service' ||
        pathname.includes('condiciones') ||
        pathname.includes('terminos') ||
        pathname.includes('terms')
      ) {
        return 'terms';
      }
      if (pathname === '/drive' || pathname === '/drive/' || pathname.startsWith('/drive')) {
        return 'drive';
      }
      if (pathname === '/mail' || pathname === '/mail/' || pathname.startsWith('/mail')) {
        return 'mail';
      }
      if (pathname === '/calendar' || pathname === '/calendar/' || pathname.startsWith('/calendar')) {
        return 'calendar';
      }
      if (pathname === '/tasks' || pathname === '/tasks/' || pathname.startsWith('/tasks')) {
        return 'tasks';
      }
    }
    return 'hub';
  };

  // Orion Workspace state
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [currentApp, setCurrentAppState] = useState<'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms'>(getInitialApp);
  const [isAppTransitioning, setIsAppTransitioning] = useState<boolean>(false);
  const [transitionTarget, setTransitionTarget] = useState<'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms' | null>(null);
  const [transitionProgress, setTransitionProgress] = useState<number>(0);

  // Sync with browser URL / history (popstate forward & back)
  useEffect(() => {
    const syncWithUrl = () => {
      if (typeof window === 'undefined') return;
      const pathname = window.location.pathname.toLowerCase();
      const target: 'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms' =
        pathname === '/privacy' ||
        pathname === '/privacy-policy' ||
        pathname.includes('privacidad') ||
        pathname.includes('privacy')
          ? 'privacy'
          : pathname === '/terms' ||
            pathname === '/terms-of-service' ||
            pathname.includes('condiciones') ||
            pathname.includes('terminos') ||
            pathname.includes('terms')
          ? 'terms'
          : pathname === '/drive' || pathname === '/drive/' || pathname.startsWith('/drive')
          ? 'drive'
          : pathname === '/mail' || pathname === '/mail/' || pathname.startsWith('/mail')
          ? 'mail'
          : pathname === '/calendar' || pathname === '/calendar/' || pathname.startsWith('/calendar')
          ? 'calendar'
          : pathname === '/tasks' || pathname === '/tasks/' || pathname.startsWith('/tasks')
          ? 'tasks'
          : 'hub';
      setCurrentAppState(target);
      if (typeof document !== 'undefined') {
        document.title =
          target === 'privacy'
            ? 'Política de Privacidad · Orion Workspace'
            : target === 'terms'
            ? 'Condiciones de Servicio · Orion Workspace'
            : target === 'tasks'
            ? 'Orion Tasks · Calendarios & Flujo'
            : target === 'calendar'
            ? 'Orion Calendar · Calendario Unificado'
            : target === 'mail'
            ? 'Orion Mail · Correo & Bandeja Unificada'
            : target === 'drive'
            ? 'Orion Drive · Almacenamiento & Archivos Cloud'
            : 'Orion Workspace';
      }
    };

    syncWithUrl();
    window.addEventListener('popstate', syncWithUrl);
    return () => window.removeEventListener('popstate', syncWithUrl);
  }, []);

  // Smooth animated transition and URL updater
  const navigateToApp = useCallback(
    (target: 'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms', options?: { immediate?: boolean }) => {
      const targetPath =
        target === 'tasks'
          ? '/tasks'
          : target === 'calendar'
          ? '/calendar'
          : target === 'mail'
          ? '/mail'
          : target === 'drive'
          ? '/drive'
          : target === 'privacy'
          ? '/privacy'
          : target === 'terms'
          ? '/terms'
          : '/';

      if (options?.immediate || target === 'privacy' || target === 'terms') {
        setCurrentAppState(target);
        if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
          window.history.pushState({ app: target }, '', targetPath);
        }
        if (typeof document !== 'undefined') {
          document.title =
            target === 'privacy'
              ? 'Política de Privacidad · Orion Workspace'
              : target === 'terms'
              ? 'Condiciones de Servicio · Orion Workspace'
              : target === 'tasks'
              ? 'Orion Tasks · Calendarios & Flujo'
              : target === 'calendar'
              ? 'Orion Calendar · Calendario Unificado'
              : target === 'mail'
              ? 'Orion Mail · Correo & Bandeja Unificada'
              : target === 'drive'
              ? 'Orion Drive · Almacenamiento & Archivos Cloud'
              : 'Orion Workspace';
        }
        return;
      }

      if (target === currentApp && !isAppTransitioning) return;

      setIsAppTransitioning(true);
      setTransitionTarget(target);
      setTransitionProgress(15);

      // Update URL immediately so browser reflects /calendar, /mail, /drive, /tasks, or /
      if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
        window.history.pushState({ app: target }, '', targetPath);
      }
      if (typeof document !== 'undefined') {
        document.title =
          target === 'tasks'
            ? 'Orion Tasks · Calendarios & Flujo'
            : target === 'calendar'
            ? 'Orion Calendar · Calendario Unificado'
            : target === 'mail'
            ? 'Orion Mail · Correo & Bandeja Unificada'
            : target === 'drive'
            ? 'Orion Drive · Almacenamiento & Archivos Cloud'
            : 'Orion Workspace';
      }

      const t1 = setTimeout(() => {
        setTransitionProgress(65);
      }, 200);

      const t2 = setTimeout(() => {
        setTransitionProgress(100);
        setCurrentAppState(target);
      }, 550);

      const t3 = setTimeout(() => {
        setIsAppTransitioning(false);
        setTransitionTarget(null);
        setTransitionProgress(0);
      }, 850);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    },
    [currentApp, isAppTransitioning]
  );

  const setCurrentApp = useCallback(
    (app: 'hub' | 'tasks' | 'calendar' | 'mail' | 'drive' | 'privacy' | 'terms', options?: { immediate?: boolean }) => {
      navigateToApp(app, options);
    },
    [navigateToApp]
  );

  // Cloud Firestore Sync State
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const firestoreInitialSyncDone = useRef(false);

  // Google Tasks state
  const [googleTaskLists, setGoogleTaskLists] = useState<GoogleTaskList[]>([]);
  const [activeGoogleTaskListId, setActiveGoogleTaskListId] = useState<string | null>(null);
  const [isSyncingGoogleTasks, setIsSyncingGoogleTasks] = useState(false);
  const [pendingGoogleTaskConfirm, setPendingGoogleTaskConfirm] = useState<GoogleTaskConfirmAction | null>(null);

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

  // Tasks state
  const [tasks, setTasks] = useState<AppTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (saved) {
        const parsed: AppTask[] = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TASKS;
  });

  // Completed event IDs (events whose duplicated tasks have been completed in Kanban/app)
  const [completedEventIds, setCompletedEventIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COMPLETED_EVENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Helper to check if an event is completed in the Kanban/app
  const isEventCompleted = useCallback(
    (eventId: string): boolean => {
      if (completedEventIds.includes(eventId)) return true;
      return tasks.some((t) => t.sourceEventId === eventId && t.status === 'completed');
    },
    [completedEventIds, tasks]
  );

  // Selected modals
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<AppTask | null>(null);
  const [dateForNewEvent, setDateForNewEvent] = useState<string | null>(null);

  // Background Notification Poller (runs every 30 seconds)
  const alertedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!notificationSettings.enabled) return;

    const checkReminders = () => {
      const now = Date.now();
      const leadMs = notificationSettings.leadTimeMinutes * 60 * 1000;

      // 1. Check Events
      if (notificationSettings.notifyEvents && events.length > 0) {
        events.forEach((evt) => {
          if (!evt.startDateTime) return;
          try {
            const startMs = new Date(evt.startDateTime).getTime();
            const diffMs = startMs - now;

            // Trigger alert if event starts within lead time window (e.g. within 10 min, and has not yet started more than 2 min ago)
            if (diffMs > -120000 && diffMs <= leadMs) {
              const alertKey = `evt-${evt.id}-${new Date(evt.startDateTime).toDateString()}`;
              if (!alertedIdsRef.current.has(alertKey)) {
                alertedIdsRef.current.add(alertKey);

                const minutesLeft = Math.max(0, Math.round(diffMs / 60000));
                const timeText = minutesLeft === 0 ? '¡Comienza ahora!' : `En ${minutesLeft} minutos`;

                const notifItem: OrionNotificationItem = {
                  id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  title: `Próximo evento: ${evt.title}`,
                  body: `${timeText} (${formatEventShortTime(evt.startDateTime)})${evt.location ? ` · ${evt.location}` : ''}`,
                  timestamp: new Date().toISOString(),
                  type: 'event',
                  read: false,
                  targetId: evt.id,
                  targetApp: 'calendar',
                };

                setNotifications((prev) => [notifItem, ...prev.slice(0, 49)]);

                sendDesktopNotification({
                  title: `🔔 ${evt.title}`,
                  body: `${timeText} (${formatEventShortTime(evt.startDateTime)})${evt.location ? ` · ${evt.location}` : ''}`,
                  sound: notificationSettings.soundEnabled,
                  onClick: () => {
                    setCurrentApp('calendar');
                    setSelectedEventForDetail(evt);
                  },
                });
              }
            }
          } catch {}
        });
      }

      // 2. Check Tasks
      if (notificationSettings.notifyTasks && tasks.length > 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        tasks.forEach((task) => {
          if (task.status === 'completed') return;
          const taskDateStr = (task.startDateTime || task.endDateTime || '').split('T')[0];
          if (taskDateStr === todayStr) {
            const alertKey = `task-${task.id}-${todayStr}`;
            if (!alertedIdsRef.current.has(alertKey)) {
              alertedIdsRef.current.add(alertKey);

              const notifItem: OrionNotificationItem = {
                id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                title: `Tarea de hoy: ${task.title}`,
                body: `Prioridad ${task.priority.toUpperCase()} · Vence hoy`,
                timestamp: new Date().toISOString(),
                type: 'task',
                read: false,
                targetId: task.id,
                targetApp: 'tasks',
              };

              setNotifications((prev) => [notifItem, ...prev.slice(0, 49)]);

              sendDesktopNotification({
                title: `📌 Tarea pendiente: ${task.title}`,
                body: `Prioridad ${task.priority} · Vence hoy`,
                sound: notificationSettings.soundEnabled,
                onClick: () => {
                  setCurrentApp('tasks');
                  setActiveTab('tasks');
                  setSelectedTaskForDetail(task);
                },
              });
            }
          }
        });
      }
    };

    const timeout = setTimeout(checkReminders, 2500);
    const interval = setInterval(checkReminders, 30000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [
    notificationSettings.enabled,
    notificationSettings.soundEnabled,
    notificationSettings.leadTimeMinutes,
    notificationSettings.notifyEvents,
    notificationSettings.notifyTasks,
    events,
    tasks,
  ]);

  // Validate Firestore connection on boot
  useEffect(() => {
    testConnection();
  }, []);

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
        if (expired) {
          count++;
          if (user?.uid) {
            deleteTaskFromFirestore(user.uid, t.id).catch((err) => console.error(err));
          }
        }
        return !expired;
      });
      return remaining;
    });
    return count;
  }, [isTaskExpired, user]);

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

  // -------------------------------------------------------------
  // FIRESTORE CLOUD PERSISTENCE SYNC
  // -------------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setIsCloudSynced(false);
      firestoreInitialSyncDone.current = false;
      return;
    }

    // Sync user profile document
    syncUserProfile({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      defaultCalendarId,
    });

    // Load persisted settings (completed events, stats) from Firestore
    getUserSettings(user.uid).then((settings) => {
      if (settings?.completedEventIds && Array.isArray(settings.completedEventIds)) {
        setCompletedEventIds((prev) => {
          const merged = Array.from(new Set([...prev, ...settings.completedEventIds!]));
          try {
            localStorage.setItem(STORAGE_KEY_COMPLETED_EVENTS, JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
          return merged;
        });
      }
      if (typeof settings?.historicalCompletedCount === 'number') {
        setHistoricalCompletedCount((prev) => {
          const next = Math.max(prev, settings.historicalCompletedCount!);
          try {
            localStorage.setItem(STORAGE_KEY_COMPLETED_COUNT, String(next));
          } catch (e) {
            console.error(e);
          }
          return next;
        });
      }
      if (typeof settings?.isProMember === 'boolean') {
        setIsProMember(settings.isProMember);
        try {
          localStorage.setItem(STORAGE_KEY_PRO_MEMBER, JSON.stringify(settings.isProMember));
        } catch (e) {
          console.error(e);
        }
      }
    });

    // Real-time listener for user's tasks stored in Firestore
    const unsubscribeTasks = subscribeToUserTasks(
      user.uid,
      (firestoreTasks) => {
        setIsCloudSynced(true);

        if (!firestoreInitialSyncDone.current) {
          firestoreInitialSyncDone.current = true;

          // If user had local tasks that don't exist in Firestore, migrate them up to Firestore!
          if (firestoreTasks.length === 0) {
            try {
              const saved = localStorage.getItem(STORAGE_KEY_TASKS);
              const localTasks: AppTask[] = saved ? JSON.parse(saved) : [];
              if (localTasks.length > 0) {
                batchSaveTasksToFirestore(user.uid, localTasks).catch((err) =>
                  console.error('Initial Firestore batch save error:', err)
                );
                setTasks(localTasks);
                return;
              }
            } catch (e) {
              console.error(e);
            }
          }

          // If Firestore has tasks, use Firestore tasks as cloud authority
          if (firestoreTasks.length > 0) {
            setTasks(firestoreTasks);
            try {
              localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(firestoreTasks));
            } catch (e) {
              console.error(e);
            }
            return;
          }
        }

        // Subsequent real-time updates from Firestore
        setTasks(firestoreTasks);
        try {
          localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(firestoreTasks));
        } catch (e) {
          console.error(e);
        }
      },
      (err) => {
        console.error('Firestore sync error:', err);
        setIsCloudSynced(false);
      }
    );

    // Real-time listener for user notes stored in Firestore
    const unsubscribeNotes = subscribeToUserNotes(
      user.uid,
      (firestoreNotes) => {
        if (firestoreNotes.length > 0) {
          setNotes(
            firestoreNotes.map((n) => ({
              ...n,
              tags: (n.tags || []).filter((t) => t.toUpperCase() !== 'PRO'),
            }))
          );
        }
      },
      (err) => {
        console.error('Firestore notes sync error:', err);
      }
    );

    return () => {
      unsubscribeTasks();
      unsubscribeNotes();
    };
  }, [user]);

  // Sync Google Calendars and Events
  const syncGoogleCalendarData = useCallback(
    async (token: string) => {
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
          const primary = gCalendars.find((c) => c.isPrimary) || gCalendars[0];
          if (primary) {
            activeDefCal = primary.id;
            setDefaultCalendarId(primary.id);
            localStorage.setItem(STORAGE_KEY_DEFAULT_CAL, primary.id);
            if (user?.uid) {
              syncUserProfile({ uid: user.uid, defaultCalendarId: primary.id });
            }
          }
        }

        const eventsPromises = gCalendars
          .slice(0, 8)
          .map((cal) => fetchGoogleCalendarEvents(token, cal.id, cal.name, cal.color));

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
                const clone = createClonedTaskFromEvent(evt);
                newClones.push(clone);
                existingSourceIds.add(evt.id);

                // Persist new clones to Firestore
                if (user?.uid) {
                  saveTaskToFirestore(user.uid, clone).catch((e) => console.error(e));
                }
              }
            }

            if (newClones.length > 0) {
              return [...newClones, ...prevTasks];
            }
            return prevTasks;
          });
        }

        // Also fetch Google Tasks lists if available
        try {
          const lists = await fetchGoogleTaskLists(token);
          setGoogleTaskLists(lists);
          if (lists.length > 0 && !activeGoogleTaskListId) {
            setActiveGoogleTaskListId(lists[0].id);
          }
        } catch (tasksErr) {
          console.warn('Google Tasks scope may need authorization or empty lists:', tasksErr);
        }
      } catch (err: any) {
        const isAuthError =
          err?.isAuthExpired ||
          err?.status === 401 ||
          err?.message === 'TOKEN_EXPIRED' ||
          err?.message?.includes('401') ||
          err?.message?.toLowerCase().includes('credential') ||
          err?.message?.toLowerCase().includes('unauthenticated');

        if (isAuthError) {
          console.warn('Google Calendar auth token has expired or is invalid. Resetting connection state.');
          clearStoredAccessToken();
          setGoogleToken(null);
          setGoogleSyncError('Tu sesión de Google ha expirado. Haz clic en "Conectar con Google" para renovarla.');
        } else {
          console.warn('Error sincronizando con Google Calendar:', err?.message || err);
          setGoogleSyncError(err?.message || 'Error al conectar con Google Calendar');
        }
      } finally {
        setIsLoadingGoogle(false);
      }
    },
    [defaultCalendarId, user, activeGoogleTaskListId]
  );

  // Set default calendar and automatically duplicate all its existing non-expired events!
  const setDefaultCalendar = (calendarId: string) => {
    setDefaultCalendarId(calendarId);
    try {
      localStorage.setItem(STORAGE_KEY_DEFAULT_CAL, calendarId);
    } catch (e) {
      console.error(e);
    }

    if (user?.uid) {
      syncUserProfile({ uid: user.uid, defaultCalendarId: calendarId });
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

      const newClones = eventsToClone.map((evt) => {
        const clone = createClonedTaskFromEvent(evt);
        if (user?.uid) {
          saveTaskToFirestore(user.uid, clone).catch((err) => console.error(err));
        }
        return clone;
      });

      return [...newClones, ...prevTasks];
    });
  };

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setGoogleToken(token);
        if (token) {
          syncGoogleCalendarData(token);
        }
      },
      () => {
        setUser(null);
        setGoogleToken(null);
        setIsCloudSynced(false);
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
        setIsWorkspaceModalOpen(true);
      }
    } catch (err: any) {
      const isUnauthDomain =
        err?.code === 'auth/unauthorized-domain' ||
        err?.isUnauthorizedDomain ||
        err?.message?.includes('unauthorized-domain') ||
        err?.message?.includes('not authorized');

      if (isUnauthDomain) {
        const domain =
          err?.unauthorizedHost ||
          (typeof window !== 'undefined' ? window.location.hostname : 'orionworkspace.vercel.app');
        setUnauthorizedDomainForModal(domain);
        setGoogleSyncError(
          `Dominio no autorizado (${domain}). Añade este dominio a la lista de Dominios Autorizados en la consola de Firebase Authentication.`
        );
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setGoogleSyncError('Se cerró la ventana emergente antes de completar el inicio de sesión.');
      } else if (err?.code === 'auth/popup-blocked') {
        setGoogleSyncError('El navegador bloqueó la ventana emergente. Por favor permite los popups para este sitio.');
      } else {
        setGoogleSyncError(err?.friendlyMessage || err?.message || 'Error durante el inicio de sesión con Google');
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const logoutGoogle = async () => {
    await googleSignOut();
    setUser(null);
    setGoogleToken(null);
    setIsCloudSynced(false);
  };

  const refreshGoogleData = async () => {
    if (googleToken) {
      await syncGoogleCalendarData(googleToken);
    }
  };

  // Local storage backups
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
    return tasks.some((t) => t.sourceEventId === eventId && !isTaskExpired(t));
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
    setCalendars((prev) => [...prev, newCal]);
  };

  const updateCalendarColor = (calendarId: string, newColor: string) => {
    setCalendars((prev) => prev.map((c) => (c.id === calendarId ? { ...c, color: newColor } : c)));
    setEvents((prev) => prev.map((e) => (e.calendarId === calendarId ? { ...e, calendarColor: newColor } : e)));
    setTasks((prev) => {
      const updated = prev.map((t) => (t.calendarId === calendarId ? { ...t, calendarColor: newColor } : t));
      if (user?.uid) {
        updated.forEach((t) => {
          if (t.calendarId === calendarId) saveTaskToFirestore(user.uid, t);
        });
      }
      return updated;
    });
  };

  // Add Event (with automatic duplication if created for default calendar and date is not expired!)
  const addEvent = (eventData: Omit<CalendarEvent, 'id'>): CalendarEvent => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
    };
    setEvents((prev) => [newEvent, ...prev]);

    // Automatic duplication if belongs to default calendar and is not expired
    if (
      defaultCalendarId &&
      newEvent.calendarId === defaultCalendarId &&
      !isEventExpired(newEvent.endDateTime, newEvent.startDateTime, newEvent.isAllDay)
    ) {
      const autoTask = createClonedTaskFromEvent(newEvent);
      setTasks((prev) => [autoTask, ...prev]);
      if (user?.uid) {
        saveTaskToFirestore(user.uid, autoTask).catch((err) => console.error(err));
      }
    }

    return newEvent;
  };

  const updateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
    );
    if (selectedEventForDetail?.id === eventId) {
      setSelectedEventForDetail((prev) => (prev ? { ...prev, ...updates } : null));
    }
    setToast({
      id: `toast-${Date.now()}`,
      message: 'Evento actualizado correctamente',
    });
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    if (selectedEventForDetail?.id === eventId) {
      setSelectedEventForDetail(null);
    }
  };

  // Import ICS content
  const importICS = (
    icsContent: string,
    calendarName = 'Calendario Importado',
    calendarColor = '#06B6D4'
  ): number => {
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
      setCalendars((prev) => [...prev, newCal]);
      setEvents((prev) => [...parsedEvents, ...prev]);
      setActiveCalendarId(newCalId);

      // Auto duplicate non-expired events if this was chosen as default
      if (defaultCalendarId === newCalId) {
        const newTasks = parsedEvents
          .filter((e) => !isEventExpired(e.endDateTime, e.startDateTime, e.isAllDay))
          .map((e) => {
            const clone = createClonedTaskFromEvent(e);
            if (user?.uid) {
              saveTaskToFirestore(user.uid, clone).catch((err) => console.error(err));
            }
            return clone;
          });
        setTasks((prev) => [...newTasks, ...prev]);
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
    const sourceEvt = events.find((e) => e.id === eventId);
    if (!sourceEvt) throw new Error('Evento no encontrado');

    // Comprobar si el evento ha vencido
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

    setTasks((prev) => [newTask, ...prev]);

    // If the event was previously marked completed, unmark it so it returns to active flow
    setCompletedEventIds((prev) => {
      if (prev.includes(sourceEvt.id)) {
        const next = prev.filter((id) => id !== sourceEvt.id);
        try {
          localStorage.setItem(STORAGE_KEY_COMPLETED_EVENTS, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        if (user?.uid) {
          syncUserSettings(user.uid, { completedEventIds: next });
        }
        return next;
      }
      return prev;
    });

    // Persist to Firestore linked to user's Google Account
    if (user?.uid) {
      saveTaskToFirestore(user.uid, newTask).catch((err) => console.error(err));
    }

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

    setTasks((prev) => [newTask, ...prev]);

    // Persist to Firestore linked to user's Google Account
    if (user?.uid) {
      saveTaskToFirestore(user.uid, newTask).catch((err) => console.error(err));
    }

    return newTask;
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated: AppTask = {
            ...t,
            status,
            completedAt: status === 'completed' ? (t.completedAt || new Date().toISOString()) : undefined,
          };
          if (user?.uid) {
            saveTaskToFirestore(user.uid, updated).catch((err) => console.error(err));
          }
          return updated;
        }
        return t;
      })
    );

    if (status === 'completed') {
      const taskToComplete = tasks.find((t) => t.id === taskId);
      if (taskToComplete?.sourceEventId) {
        const srcId = taskToComplete.sourceEventId;
        setCompletedEventIds((prev) => {
          if (!prev.includes(srcId)) {
            const next = [...prev, srcId];
            try {
              localStorage.setItem(STORAGE_KEY_COMPLETED_EVENTS, JSON.stringify(next));
            } catch (e) {
              console.error(e);
            }
            if (user?.uid) {
              syncUserSettings(user.uid, { completedEventIds: next });
            }
            return next;
          }
          return prev;
        });
      }

      setHistoricalCompletedCount((prev) => {
        const next = prev + 1;
        try {
          localStorage.setItem(STORAGE_KEY_COMPLETED_COUNT, String(next));
        } catch (e) {
          console.error(e);
        }
        if (user?.uid) {
          syncUserSettings(user.uid, { historicalCompletedCount: next });
        }
        return next;
      });

      setToast({
        id: `toast-${Date.now()}`,
        message: `"${taskToComplete?.title || 'Tarea'}" guardada en la columna Hecho y sincronizada con Firebase.`,
      });
    }

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const finalizeAndRemoveTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const updateTask = (taskId: string, updates: Partial<AppTask>) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, ...updates };
          if (user?.uid) {
            saveTaskToFirestore(user.uid, updated).catch((err) => console.error(err));
          }
          return updated;
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (user?.uid) {
      deleteTaskFromFirestore(user.uid, taskId).catch((err) => console.error(err));
    }
    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail(null);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((s) =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
          );
          const updated = { ...t, subtasks: updatedSubtasks };
          if (user?.uid) {
            saveTaskToFirestore(user.uid, updated).catch((err) => console.error(err));
          }
          return updated;
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)),
        };
      });
    }
  };

  const addSubtask = (taskId: string, text: string) => {
    if (!text.trim()) return;
    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      text: text.trim(),
      completed: false,
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, subtasks: [...t.subtasks, newSub] };
          if (user?.uid) {
            saveTaskToFirestore(user.uid, updated).catch((err) => console.error(err));
          }
          return updated;
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) => (prev ? { ...prev, subtasks: [...prev.subtasks, newSub] } : null));
    }
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) };
          if (user?.uid) {
            saveTaskToFirestore(user.uid, updated).catch((err) => console.error(err));
          }
          return updated;
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) =>
        prev ? { ...prev, subtasks: prev.subtasks.filter((s) => s.id !== subtaskId) } : null
      );
    }
  };

  const applyAISummary = (taskId: string, analysis: AISummaryResult) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const existingTexts = new Set(t.subtasks.map((s) => s.text.toLowerCase()));
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
          const updated = {
            ...t,
            aiAnalysis: analysis,
            priority: analysis.suggestedPriority || t.priority,
            subtasks: newSubtasks,
          };
          if (user?.uid) {
            saveTaskToFirestore(user.uid, updated).catch((err) => console.error(err));
          }
          return updated;
        }
        return t;
      })
    );

    if (selectedTaskForDetail?.id === taskId) {
      setSelectedTaskForDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          aiAnalysis: analysis,
          priority: analysis.suggestedPriority || prev.priority,
        };
      });
    }
  };

  const undoLastCompletion = () => {
    if (toast?.undoTask) {
      const restored: AppTask = {
        ...toast.undoTask,
        status: 'in_progress',
      };
      setTasks((prev) => [restored, ...prev]);
      if (user?.uid) {
        saveTaskToFirestore(user.uid, restored).catch((err) => console.error(err));
      }
      setHistoricalCompletedCount((prev) => {
        const next = Math.max(0, prev - 1);
        try {
          localStorage.setItem(STORAGE_KEY_COMPLETED_COUNT, String(next));
        } catch (e) {
          console.error(e);
        }
        if (user?.uid) {
          syncUserSettings(user.uid, { historicalCompletedCount: next });
        }
        return next;
      });

      if (toast.undoTask.sourceEventId) {
        const srcId = toast.undoTask.sourceEventId;
        setCompletedEventIds((prev) => {
          const next = prev.filter((id) => id !== srcId);
          try {
            localStorage.setItem(STORAGE_KEY_COMPLETED_EVENTS, JSON.stringify(next));
          } catch (e) {
            console.error(e);
          }
          if (user?.uid) {
            syncUserSettings(user.uid, { completedEventIds: next });
          }
          return next;
        });
      }

      setToast(null);
    }
  };

  // -------------------------------------------------------------
  // GOOGLE TASKS SYNC & MUTATIONS (with workspace confirmation)
  // -------------------------------------------------------------
  const syncGoogleTasks = async (listId?: string): Promise<number> => {
    if (!googleToken) {
      throw new Error('Debes conectar tu cuenta de Google primero.');
    }

    const targetListId = listId || activeGoogleTaskListId || '@default';
    setIsSyncingGoogleTasks(true);
    try {
      const gTasks = await fetchGoogleTasks(googleToken, targetListId);
      let importedCount = 0;

      setTasks((prev) => {
        const existingGTaskIds = new Set(prev.map((t) => t.googleTaskId).filter(Boolean));
        const newItems: AppTask[] = [];

        for (const gt of gTasks) {
          if (!gt.deleted && !existingGTaskIds.has(gt.id)) {
            const isCompleted = gt.status === 'completed';
            const newTask: AppTask = {
              id: `gtask-${gt.id}`,
              googleTaskId: gt.id,
              googleTaskListId: targetListId,
              calendarId: 'google-tasks',
              calendarName: 'Google Tasks',
              calendarColor: '#2563EB',
              title: gt.title,
              description: gt.notes || '',
              startDateTime: gt.due || new Date().toISOString(),
              endDateTime: gt.due || new Date().toISOString(),
              isAllDay: true,
              status: isCompleted ? 'completed' : 'pending',
              priority: 'medium',
              notes: gt.notes || 'Importado desde Google Tasks',
              tags: ['Google Tasks'],
              subtasks: [],
              createdAt: gt.updated || new Date().toISOString(),
            };

            // Check if not expired before adding
            if (!isEventExpired(newTask.endDateTime, newTask.startDateTime, newTask.isAllDay)) {
              newItems.push(newTask);
              importedCount++;
              if (user?.uid) {
                saveTaskToFirestore(user.uid, newTask).catch((err) => console.error(err));
              }
            }
          }
        }

        if (newItems.length > 0) {
          return [...newItems, ...prev];
        }
        return prev;
      });

      setToast({
        id: `toast-${Date.now()}`,
        message: `Sincronización completada: ${importedCount} tareas sincronizadas con Google Tasks y guardadas en Firestore.`,
      });

      return importedCount;
    } catch (err: any) {
      console.error('Error al sincronizar Google Tasks:', err);
      setToast({
        id: `toast-${Date.now()}`,
        message: `Error al sincronizar con Google Tasks: ${err?.message || 'Permiso denegado'}`,
      });
      throw err;
    } finally {
      setIsSyncingGoogleTasks(false);
    }
  };

  const createTaskInGoogleTasks = async (
    title: string,
    notes?: string,
    due?: string,
    listId?: string
  ): Promise<AppTask> => {
    if (!googleToken) {
      throw new Error('Conecta tu cuenta de Google para sincronizar con Google Tasks.');
    }

    const targetListId = listId || activeGoogleTaskListId || '@default';
    const createdGTask = await createGoogleTask(googleToken, targetListId, {
      title,
      notes,
      due,
    });

    const newTask: AppTask = {
      id: `gtask-${createdGTask.id}`,
      googleTaskId: createdGTask.id,
      googleTaskListId: targetListId,
      calendarId: 'google-tasks',
      calendarName: 'Google Tasks',
      calendarColor: '#2563EB',
      title: createdGTask.title,
      description: createdGTask.notes || notes || '',
      startDateTime: createdGTask.due || due || new Date().toISOString(),
      endDateTime: createdGTask.due || due || new Date().toISOString(),
      isAllDay: true,
      status: createdGTask.status === 'completed' ? 'completed' : 'pending',
      priority: 'medium',
      notes: createdGTask.notes || notes || '',
      tags: ['Google Tasks'],
      subtasks: [],
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    if (user?.uid) {
      saveTaskToFirestore(user.uid, newTask).catch((err) => console.error(err));
    }

    setToast({
      id: `toast-${Date.now()}`,
      message: `Tarea creada en Google Tasks y guardada en tu cuenta de Google Orion.`,
    });

    return newTask;
  };

  // Workspace Confirmation logic for Google Tasks mutating actions
  const cancelGoogleTaskConfirm = () => {
    setPendingGoogleTaskConfirm(null);
  };

  const executeGoogleTaskConfirm = async () => {
    if (!pendingGoogleTaskConfirm || !googleToken) {
      setPendingGoogleTaskConfirm(null);
      return;
    }

    const { type, task, listId } = pendingGoogleTaskConfirm;
    setPendingGoogleTaskConfirm(null);

    try {
      if (type === 'complete' && task.googleTaskId) {
        await updateGoogleTask(googleToken, listId, task.googleTaskId, {
          status: 'completed',
        });
        updateTaskStatus(task.id, 'completed');
      } else if (type === 'delete' && task.googleTaskId) {
        await deleteGoogleTask(googleToken, listId, task.googleTaskId);
        deleteTask(task.id);
        setToast({
          id: `toast-${Date.now()}`,
          message: `Tarea "${task.title}" eliminada de Google Tasks y de tu tablero.`,
        });
      }
    } catch (err: any) {
      console.error('Error ejecutando acción de Google Tasks:', err);
      setToast({
        id: `toast-${Date.now()}`,
        message: `Error al actualizar en Google Tasks: ${err?.message}`,
      });
    }
  };

  const completeEvent = useCallback(
    (eventId: string) => {
      const linkedTask = tasks.find((t) => t.sourceEventId === eventId && !isTaskExpired(t));
      if (linkedTask) {
        updateTaskStatus(linkedTask.id, 'completed');
      } else {
        const sourceEvt = events.find((e) => e.id === eventId);
        const title = sourceEvt?.title || 'Evento';

        setCompletedEventIds((prev) => {
          if (!prev.includes(eventId)) {
            const next = [...prev, eventId];
            try {
              localStorage.setItem(STORAGE_KEY_COMPLETED_EVENTS, JSON.stringify(next));
            } catch (e) {
              console.error(e);
            }
            if (user?.uid) {
              syncUserSettings(user.uid, { completedEventIds: next });
            }
            return next;
          }
          return prev;
        });

        setHistoricalCompletedCount((prev) => {
          const next = prev + 1;
          try {
            localStorage.setItem(STORAGE_KEY_COMPLETED_COUNT, String(next));
          } catch (e) {
            console.error(e);
          }
          if (user?.uid) {
            syncUserSettings(user.uid, { historicalCompletedCount: next });
          }
          return next;
        });

        setToast({
          id: `toast-${Date.now()}`,
          message: `"${title}" finalizado en el flujo de la app. El evento original permanece en tu calendario. Se avanza al siguiente evento.`,
          undoTask: sourceEvt ? createClonedTaskFromEvent(sourceEvt) : undefined,
        });
      }
    },
    [tasks, events, isTaskExpired, user, updateTaskStatus]
  );

  const getLinkedTaskForEvent = useCallback(
    (eventId: string): AppTask | undefined => {
      return tasks.find((t) => t.sourceEventId === eventId && !isTaskExpired(t));
    },
    [tasks, isTaskExpired]
  );

  const changeEventPriority = useCallback(
    (eventId: string, newPriority: TaskPriority) => {
      const linked = tasks.find((t) => t.sourceEventId === eventId && !isTaskExpired(t));
      if (linked) {
        updateTask(linked.id, { priority: newPriority });
      } else {
        duplicateEventToApp(eventId, newPriority, 'pending');
      }
    },
    [tasks, isTaskExpired, updateTask, duplicateEventToApp]
  );

  // List of upcoming uncompleted and unexpired events
  const upcomingEventsList = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => {
        const completed = isEventCompleted(e.id);
        const expired = isEventExpired(e.endDateTime, e.startDateTime, e.isAllDay);
        const end = new Date(e.endDateTime).getTime();
        return !completed && !expired && end >= now;
      })
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  }, [events, isEventCompleted, isEventExpired]);

  // Next event shown on Dashboard: ALWAYS excludes completed events from Kanban/app!
  const nextUpcomingEvent = useMemo(() => {
    if (upcomingEventsList.length > 0) {
      return upcomingEventsList[0];
    }
    return null;
  }, [upcomingEventsList]);

  const stats = useMemo(() => {
    const total = tasks.length + historicalCompletedCount;
    const completed = historicalCompletedCount;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      completionRate,
    };
  }, [tasks, historicalCompletedCount]);

  const toggleProMembership = useCallback(() => {
    setIsProMember((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_PRO_MEMBER, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      if (user?.uid) {
        syncUserSettings(user.uid, { isProMember: next });
      }
      return next;
    });
  }, [user]);

  const addNote = useCallback(
    (noteData: Omit<AppNote, 'id' | 'createdAt' | 'updatedAt'>): AppNote => {
      const now = new Date().toISOString();
      const newNote: AppNote = {
        ...noteData,
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: now,
        updatedAt: now,
      };

      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);

      if (user?.uid) {
        saveNoteToFirestore(user.uid, newNote).catch((err) => console.error(err));
      }

      setToast({
        id: `toast-${Date.now()}`,
        message: `Nota "${newNote.title}" creada y guardada en tu cuenta.`,
      });

      return newNote;
    },
    [user]
  );

  const updateNote = useCallback(
    (noteId: string, updates: Partial<AppNote>) => {
      setNotes((prev) =>
        prev.map((n) => {
          if (n.id === noteId) {
            const updated = {
              ...n,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            if (user?.uid) {
              saveNoteToFirestore(user.uid, updated).catch((err) => console.error(err));
            }
            return updated;
          }
          return n;
        })
      );
    },
    [user]
  );

  const deleteNote = useCallback(
    (noteId: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setSelectedNoteId((current) => (current === noteId ? null : current));
      if (user?.uid) {
        deleteNoteFromFirestore(user.uid, noteId).catch((err) => console.error(err));
      }
      setToast({
        id: `toast-${Date.now()}`,
        message: 'Nota eliminada correctamente.',
      });
    },
    [user]
  );

  const linkNoteToTask = useCallback(
    (noteId: string, taskId?: string) => {
      updateNote(noteId, { linkedTaskId: taskId || undefined });
    },
    [updateNote]
  );

  const linkNoteToEvent = useCallback(
    (noteId: string, eventId?: string) => {
      updateNote(noteId, { linkedEventId: eventId || undefined });
    },
    [updateNote]
  );

  const getNotesForTask = useCallback(
    (taskId: string): AppNote[] => {
      return notes.filter((n) => n.linkedTaskId === taskId);
    },
    [notes]
  );

  const getNotesForEvent = useCallback(
    (eventId: string): AppNote[] => {
      return notes.filter((n) => n.linkedEventId === eventId);
    },
    [notes]
  );

  return (
    <CalendarContext.Provider
      value={{
        user,
        googleToken,
        isGoogleConnected: Boolean(user && googleToken),
        isLoadingGoogle,
        googleSyncError,
        unauthorizedDomainForModal,
        setUnauthorizedDomainForModal,
        loginWithGoogle,
        logoutGoogle,
        refreshGoogleData,
        isCloudSynced,
        googleTaskLists,
        activeGoogleTaskListId,
        setActiveGoogleTaskListId,
        isSyncingGoogleTasks,
        syncGoogleTasks,
        createTaskInGoogleTasks,
        pendingGoogleTaskConfirm,
        cancelGoogleTaskConfirm,
        executeGoogleTaskConfirm,
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
        updateEvent,
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
        completedEventIds,
        isEventCompleted,
        completeEvent,
        getLinkedTaskForEvent,
        upcomingEventsList,
        changeEventPriority,
        isWorkspaceModalOpen,
        setIsWorkspaceModalOpen,
        currentApp,
        setCurrentApp,
        navigateToApp,
        isAppTransitioning,
        transitionTarget,
        transitionProgress,
        isProMember,
        setIsProMember,
        toggleProMembership,
        notes,
        selectedNoteId,
        setSelectedNoteId,
        addNote,
        updateNote,
        deleteNote,
        linkNoteToTask,
        linkNoteToEvent,
        getNotesForTask,
        getNotesForEvent,
        habits,
        addHabit,
        toggleHabitDate,
        deleteHabit,
        isSpotlightOpen,
        setIsSpotlightOpen,
        notificationSettings,
        updateNotificationSettings,
        notifications,
        unreadNotificationCount,
        desktopPermission,
        requestDesktopPermission,
        markAllNotificationsAsRead,
        clearNotifications,
        deleteNotification,
        triggerTestNotification,
        isNotificationCenterOpen,
        setIsNotificationCenterOpen,
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
