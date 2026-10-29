import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendar } from '../context/CalendarContext';
import {
  Search,
  X,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  FileText,
  Mail,
  Zap,
  ArrowRight,
  Clock,
  Sparkles,
  Flame,
  LayoutGrid,
  CornerDownLeft,
  Tag,
  HardDrive,
} from 'lucide-react';
import { AppTask, CalendarEvent, AppNote, HabitItem } from '../types/calendar';

interface SpotlightItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ReactNode;
  data?: any;
  run: () => void;
}

export const OrionSpotlight: React.FC = () => {
  const {
    isSpotlightOpen,
    setIsSpotlightOpen,
    currentApp,
    setCurrentApp,
    setActiveTab,
    events,
    tasks,
    notes,
    habits,
    toggleHabitDate,
    setSelectedEventForDetail,
    setSelectedTaskForDetail,
    setSelectedNoteId,
  } = useCalendar();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically when opened
  useEffect(() => {
    if (isSpotlightOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isSpotlightOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isSpotlightOpen) return;
      if (e.key === 'Escape') {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSpotlightOpen, setIsSpotlightOpen]);

  // Retrieve stored emails if any
  const storedEmails = useMemo(() => {
    try {
      const raw = localStorage.getItem('orion_custom_emails_v1');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return [];
  }, [isSpotlightOpen]);

  // Build searchable items
  const quickActions: SpotlightItem[] = [
    {
      id: 'app-tasks',
      type: 'action',
      title: 'Ir a Orion Tasks',
      subtitle: 'Tablero Kanban, lista y flujo de trabajo',
      category: 'Acciones Rápidas',
      icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
      run: () => {
        setCurrentApp('tasks');
        setActiveTab('tasks');
        setIsSpotlightOpen(false);
      },
    },
    {
      id: 'app-calendar',
      type: 'action',
      title: 'Ir a Orion Calendar',
      subtitle: 'Vista de semana, mes, día y agenda',
      category: 'Acciones Rápidas',
      icon: <CalendarIcon className="w-4 h-4 text-indigo-500" />,
      run: () => {
        setCurrentApp('calendar');
        setIsSpotlightOpen(false);
      },
    },
    {
      id: 'app-mail',
      type: 'action',
      title: 'Ir a Orion Mail',
      subtitle: 'Buzón unificado con IA y sincronización Gmail',
      category: 'Acciones Rápidas',
      icon: <Mail className="w-4 h-4 text-purple-500" />,
      run: () => {
        setCurrentApp('mail');
        setIsSpotlightOpen(false);
      },
    },
    {
      id: 'app-notes',
      type: 'action',
      title: 'Ir a Orion Notes',
      subtitle: 'Cuaderno de notas, checklists y minutas',
      category: 'Acciones Rápidas',
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
      run: () => {
        setCurrentApp('tasks');
        setActiveTab('notes');
        setIsSpotlightOpen(false);
      },
    },
    {
      id: 'app-drive',
      type: 'action',
      title: 'Ir a Orion Drive',
      subtitle: 'Almacenamiento en la nube, visor multimedia y archivos',
      category: 'Acciones Rápidas',
      icon: <HardDrive className="w-4 h-4 text-violet-500" />,
      run: () => {
        setCurrentApp('drive');
        setIsSpotlightOpen(false);
      },
    },
    {
      id: 'app-hub',
      type: 'action',
      title: 'Ir al Hub de Workspace',
      subtitle: 'Selector principal de aplicaciones',
      category: 'Acciones Rápidas',
      icon: <LayoutGrid className="w-4 h-4 text-amber-500" />,
      run: () => {
        setCurrentApp('hub');
        setIsSpotlightOpen(false);
      },
    },
  ];

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Default: show quick actions + today's habits
      return [
        ...quickActions,
        ...habits.slice(0, 3).map((h) => ({
          id: `habit-${h.id}`,
          type: 'habit',
          title: h.title,
          subtitle: `Racha: 🔥 ${h.streak} días · Categoría: ${h.category}`,
          category: 'Hábitos Diarios',
          icon: <Flame className="w-4 h-4 text-amber-500" />,
          data: h,
          run: () => {
            const today = new Date().toISOString().split('T')[0];
            toggleHabitDate(h.id, today);
          },
        })),
      ];
    }

    const results: Array<{
      id: string;
      type: string;
      title: string;
      subtitle: string;
      category: string;
      icon: React.ReactNode;
      data?: any;
      run: () => void;
    }> = [];

    // Search Quick Actions
    quickActions.forEach((act) => {
      if (act.title.toLowerCase().includes(q) || act.subtitle.toLowerCase().includes(q)) {
        results.push(act);
      }
    });

    // Search Tasks
    tasks.forEach((t) => {
      if (
        t.title.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.subtasks?.some((st) => st.text.toLowerCase().includes(q))
      ) {
        results.push({
          id: `task-${t.id}`,
          type: 'task',
          title: t.title,
          subtitle: `Estado: ${t.status === 'completed' ? 'Completada' : t.status === 'in_progress' ? 'En curso' : 'Pendiente'} · Prioridad: ${t.priority}`,
          category: 'Tareas',
          icon: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
          data: t,
          run: () => {
            setSelectedTaskForDetail(t);
            setCurrentApp('tasks');
            setActiveTab('tasks');
            setIsSpotlightOpen(false);
          },
        });
      }
    });

    // Search Events
    events.forEach((ev) => {
      if (
        ev.title.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q) ||
        ev.location?.toLowerCase().includes(q) ||
        ev.attendees?.some((a) => a.displayName?.toLowerCase().includes(q) || a.email.toLowerCase().includes(q))
      ) {
        results.push({
          id: `event-${ev.id}`,
          type: 'event',
          title: ev.title,
          subtitle: `${ev.calendarName} · ${new Date(ev.startDateTime).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
          category: 'Eventos de Calendario',
          icon: <CalendarIcon className="w-4 h-4 text-indigo-500" />,
          data: ev,
          run: () => {
            setSelectedEventForDetail(ev);
            setCurrentApp('calendar');
            setIsSpotlightOpen(false);
          },
        });
      }
    });

    // Search Notes
    notes.forEach((n) => {
      if (
        n.title.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q) ||
        n.tags?.some((tag) => tag.toLowerCase().includes(q))
      ) {
        results.push({
          id: `note-${n.id}`,
          type: 'note',
          title: n.title,
          subtitle: n.tags && n.tags.length > 0 ? `Etiquetas: ${n.tags.join(', ')}` : 'Nota personal',
          category: 'Notas',
          icon: <FileText className="w-4 h-4 text-emerald-500" />,
          data: n,
          run: () => {
            setSelectedNoteId(n.id);
            setCurrentApp('tasks');
            setActiveTab('notes');
            setIsSpotlightOpen(false);
          },
        });
      }
    });

    // Search Emails
    storedEmails.forEach((em: any) => {
      if (
        em.subject?.toLowerCase().includes(q) ||
        em.body?.toLowerCase().includes(q) ||
        em.from?.name?.toLowerCase().includes(q) ||
        em.from?.email?.toLowerCase().includes(q)
      ) {
        results.push({
          id: `mail-${em.id}`,
          type: 'mail',
          title: em.subject || 'Sin asunto',
          subtitle: `De: ${em.from?.name || em.from?.email || 'Desconocido'}`,
          category: 'Correos (Mail)',
          icon: <Mail className="w-4 h-4 text-purple-500" />,
          data: em,
          run: () => {
            setCurrentApp('mail');
            setIsSpotlightOpen(false);
          },
        });
      }
    });

    // Search Habits
    habits.forEach((h) => {
      if (h.title.toLowerCase().includes(q) || h.category.toLowerCase().includes(q)) {
        results.push({
          id: `habit-${h.id}`,
          type: 'habit',
          title: h.title,
          subtitle: `Racha: 🔥 ${h.streak} días · Categoría: ${h.category}`,
          category: 'Hábitos Diarios',
          icon: <Flame className="w-4 h-4 text-amber-500" />,
          data: h,
          run: () => {
            const today = new Date().toISOString().split('T')[0];
            toggleHabitDate(h.id, today);
          },
        });
      }
    });

    // Search Drive Files
    try {
      const rawDrive = localStorage.getItem('orion_drive_files_v2');
      if (rawDrive) {
        const driveFiles = JSON.parse(rawDrive);
        driveFiles.forEach((df: any) => {
          if (!df.isTrash && (df.name?.toLowerCase().includes(q) || df.extension?.toLowerCase().includes(q))) {
            results.push({
              id: `drive-${df.id}`,
              type: 'drive',
              title: df.name,
              subtitle: `Archivo · ${df.extension.toUpperCase()} (${(df.size / 1024).toFixed(0)} KB)`,
              category: 'Orion Drive',
              icon: <HardDrive className="w-4 h-4 text-violet-500" />,
              data: df,
              run: () => {
                setCurrentApp('drive');
                setIsSpotlightOpen(false);
              },
            });
          }
        });
      }
    } catch {}

    return results;
  }, [
    query,
    quickActions,
    tasks,
    events,
    notes,
    storedEmails,
    habits,
    setSelectedTaskForDetail,
    setSelectedEventForDetail,
    setSelectedNoteId,
    setCurrentApp,
    setActiveTab,
    setIsSpotlightOpen,
    toggleHabitDate,
  ]);

  // Keep index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredResults.length) {
      setSelectedIndex(0);
    }
  }, [filteredResults.length, selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        filteredResults[selectedIndex].run();
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      {isSpotlightOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-md">
          {/* Backdrop click to dismiss */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setIsSpotlightOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -14 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="w-full max-w-2xl liquid-glass rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top iridescent specular highlight sheen */}
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/30" />

            {/* Search Input Bar */}
            <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-neutral-400 dark:text-neutral-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar tareas, eventos, notas, correos o hábitos..."
                className="flex-1 bg-transparent text-base sm:text-lg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none font-medium"
              />
              {query ? (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-neutral-200/50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 border border-neutral-300/40 dark:border-neutral-700/40 select-none">
                  ESC
                </span>
              )}
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredResults.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 dark:text-neutral-500">
                  <p className="text-sm">No se encontraron resultados para "{query}"</p>
                  <p className="text-xs mt-1 text-neutral-400/80">
                    Prueba buscando por título, persona, fecha o etiqueta.
                  </p>
                </div>
              ) : (
                filteredResults.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isHabit = item.type === 'habit' && item.data;
                  const isHabitDoneToday = isHabit && item.data.completedDates?.includes(todayStr);

                  return (
                    <div
                      key={item.id}
                      onClick={item.run}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600/10 dark:bg-white/10 text-neutral-950 dark:text-white shadow-2xs'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                            isSelected ? 'scale-105 shadow-xs' : ''
                          } bg-white dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold truncate">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-200/50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border border-neutral-300/30 dark:border-neutral-700/30 shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Right indicator or habit quick-toggle */}
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        {isHabit ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              item.run();
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isHabitDoneToday
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <Circle
                              className={`w-3.5 h-3.5 ${isHabitDoneToday ? 'fill-emerald-500 text-emerald-500' : ''}`}
                            />
                            <span>{isHabitDoneToday ? 'Completado hoy' : 'Marcar hoy'}</span>
                          </button>
                        ) : (
                          isSelected && (
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 opacity-80">
                              <span>Abrir</span>
                              <CornerDownLeft className="w-3.5 h-3.5" />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Keyboard Hints Bar */}
            <div className="px-5 py-3 border-t border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 select-none">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-[10px] font-mono border border-neutral-300/40 dark:border-neutral-700/40">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-[10px] font-mono border border-neutral-300/40 dark:border-neutral-700/40">↓</kbd>
                  <span>Navegar</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-[10px] font-mono border border-neutral-300/40 dark:border-neutral-700/40">↵</kbd>
                  <span>Seleccionar</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-[10px] font-mono border border-neutral-300/40 dark:border-neutral-700/40">esc</kbd>
                  <span>Cerrar</span>
                </span>
              </div>
              <div className="flex items-center gap-1 font-medium text-neutral-400">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Orion Spotlight</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
