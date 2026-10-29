import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendar } from '../../context/CalendarContext';
import { OrionAppSwitcher } from '../OrionAppSwitcher';
import { GoogleAuthButton } from '../GoogleAuthButton';
import { OrionCalendarMiniMonth } from './OrionCalendarMiniMonth';
import { OrionCalendarWeekView } from './OrionCalendarWeekView';
import { OrionCalendarMonthView } from './OrionCalendarMonthView';
import { OrionCalendarDayView } from './OrionCalendarDayView';
import { OrionCalendarAgendaView } from './OrionCalendarAgendaView';
import { NewEventModal } from '../NewEventModal';
import { NewCalendarModal } from '../NewCalendarModal';
import { ImportICSModal } from '../ImportICSModal';
import { EventDetailModal } from '../EventDetailModal';
import { OrionWorkspaceModal } from '../OrionWorkspaceModal';
import { OrionNotificationCenter } from '../OrionNotificationCenter';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Sun,
  Moon,
  LayoutGrid,
  Check,
  CheckSquare,
  UploadCloud,
  Layers,
  Sparkles,
  AlertCircle,
  Copy,
  Search,
  CloudSun,
} from 'lucide-react';
import { getWeekDays } from '../../utils/calendarData';

type CalendarViewMode = 'week' | 'month' | 'day' | 'agenda';

export const OrionCalendarApp: React.FC = () => {
  const {
    user,
    calendars,
    activeCalendarId,
    setActiveCalendarId,
    events,
    isCloudSynced,
    isLoadingGoogle,
    refreshGoogleData,
    isGoogleConnected,
    googleSyncError,
    loginWithGoogle,
    darkMode,
    toggleDarkMode,
    isWorkspaceModalOpen,
    setIsWorkspaceModalOpen,
    setCurrentApp,
    setIsSpotlightOpen,
  } = useCalendar();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedAgenda, setCopiedAgenda] = useState(false);

  const weatherForDay = useMemo(() => {
    const dayNum = currentDate.getDate();
    const presets = [
      { temp: '23°C', condition: 'Soleado', icon: '☀️', high: '25°', low: '14°' },
      { temp: '20°C', condition: 'Parcialmente nublado', icon: '🌤️', high: '22°', low: '13°' },
      { temp: '18°C', condition: 'Intervalos nubosos', icon: '⛅', high: '19°', low: '12°' },
      { temp: '22°C', condition: 'Despejado', icon: '☀️', high: '24°', low: '15°' },
      { temp: '19°C', condition: 'Agradable y suave', icon: '🌤️', high: '21°', low: '11°' },
    ];
    return presets[dayNum % presets.length];
  }, [currentDate]);

  const handleCopyDayAgenda = () => {
    const targetDateKey = currentDate.toISOString().split('T')[0];
    const dayEvents = events.filter((e) => {
      if (activeCalendarId !== 'all' && e.calendarId !== activeCalendarId) return false;
      return e.startDateTime.startsWith(targetDateKey);
    }).sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

    const dateFormatted = currentDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let text = `📅 Agenda Orion - ${dateFormatted}\n`;
    text += `═════════════════════════════════════\n`;
    if (dayEvents.length === 0) {
      text += `Sin eventos programados para este día.\n`;
    } else {
      dayEvents.forEach((ev) => {
        const time = ev.isAllDay
          ? 'Todo el día'
          : `${new Date(ev.startDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(ev.endDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        text += `• [${time}] ${ev.title}`;
        if (ev.location) text += ` (${ev.location})`;
        if (ev.meetLink) text += ` [Meet: ${ev.meetLink}]`;
        text += `\n`;
      });
    }
    text += `═════════════════════════════════════\nTotal: ${dayEvents.length} eventos`;

    navigator.clipboard.writeText(text);
    setCopiedAgenda(true);
    setTimeout(() => setCopiedAgenda(false), 2200);
  };

  // Modals state
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [prefilledDateForEvent, setPrefilledDateForEvent] = useState<string | null>(null);
  const [isNewCalendarOpen, setIsNewCalendarOpen] = useState(false);
  const [isImportICSOpen, setIsImportICSOpen] = useState(false);

  const handleOpenNewEvent = (prefill?: string) => {
    setPrefilledDateForEvent(prefill || null);
    setIsNewEventOpen(true);
  };

  // Date Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Dynamic Period Title
  const getPeriodTitle = () => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    if (viewMode === 'month') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (viewMode === 'week') {
      const days = getWeekDays(currentDate);
      const startDay = days[0];
      const endDay = days[6];
      const sameMonth = startDay.getMonth() === endDay.getMonth();
      if (sameMonth) {
        return `${startDay.getDate()} – ${endDay.getDate()} de ${monthNames[startDay.getMonth()]} ${startDay.getFullYear()}`;
      }
      return `${startDay.getDate()} ${monthNames[startDay.getMonth()].slice(0, 3)} – ${endDay.getDate()} ${monthNames[endDay.getMonth()].slice(0, 3)} ${endDay.getFullYear()}`;
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    return `Agenda ${currentDate.getFullYear()}`;
  };

  const viewTabs: { id: CalendarViewMode; label: string }[] = [
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'day', label: 'Día' },
    { id: 'agenda', label: 'Agenda' },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between font-sans antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors">
      <div>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5 bg-white/90 dark:bg-[#191919]/90 backdrop-blur-md border-b border-[#e9e9e7] dark:border-[#2e2e2e] transition-colors">
          {/* Left Zone: Orion App Switcher + Date Navigation */}
          <div className="flex items-center gap-3 shrink-0">
            <OrionAppSwitcher currentAppName="calendar" />

            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-700 hidden sm:block" />

            {/* Today + Prev/Next Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-[#e0e0de] dark:border-[#333333] rounded-md hover:bg-neutral-50 dark:hover:bg-[#252525] transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <button
                onClick={handlePrev}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors cursor-pointer"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors cursor-pointer"
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <h2 className="ml-2 text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 capitalize whitespace-nowrap hidden md:block">
                {getPeriodTitle()}
              </h2>
            </div>
          </div>

          {/* Center Zone: View Mode Tabs */}
          <nav className="flex items-center gap-1 p-1 bg-[#f4f4f2] dark:bg-[#242424] rounded-lg">
            {viewTabs.map((tab) => {
              const isActive = viewMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`relative px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCalendarViewPill"
                      className="absolute inset-0 bg-white dark:bg-[#1a1a1a] rounded-md shadow-xs -z-0"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Zone: Primary Actions + Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Daily Weather Forecast Widget */}
            <div
              title={`Pronóstico para el día: ${weatherForDay.condition} (${weatherForDay.high} / ${weatherForDay.low})`}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-100/80 dark:bg-[#252525] border border-neutral-200/60 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 shadow-2xs select-none"
            >
              <span className="text-sm">{weatherForDay.icon}</span>
              <span className="font-semibold">{weatherForDay.temp}</span>
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">
                {weatherForDay.condition}
              </span>
            </div>

            {/* Copy Day Agenda Button */}
            <button
              onClick={handleCopyDayAgenda}
              title="Copiar agenda del día al portapapeles"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                copiedAgenda
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-[#202020] text-neutral-700 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-[#252525]'
              }`}
            >
              {copiedAgenda ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
              <span className="hidden sm:inline">{copiedAgenda ? '¡Copiada!' : 'Copiar Agenda'}</span>
            </button>

            {/* Spotlight Universal Search Button */}
            <button
              onClick={() => setIsSpotlightOpen(true)}
              title="Buscar en Orion (Ctrl/Cmd + K)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#252525] border border-neutral-200/80 dark:border-neutral-800 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-blue-500" />
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 border border-neutral-300/40 dark:border-neutral-700">⌘K</kbd>
            </button>

            <button
              onClick={() => handleOpenNewEvent()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo Evento</span>
            </button>

            <button
              onClick={() => setIsWorkspaceModalOpen(true)}
              title="Orion Workspace · Tus Aplicaciones"
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <OrionNotificationCenter />

            <GoogleAuthButton compact />

            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {googleSyncError && (
          <div className="max-w-[1720px] mx-auto px-4 sm:px-6 pt-4 w-full">
            <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{googleSyncError}</span>
              </div>
              <button
                onClick={loginWithGoogle}
                className="self-start sm:self-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                Conectar con Google
              </button>
            </div>
          </div>
        )}

        {/* Workspace Body: Left Sidebar + Main Calendar View */}
        <div className="max-w-[1720px] mx-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6 items-start">
          {/* Left Sidebar */}
          <aside className="w-full md:w-64 shrink-0 space-y-4">
            {/* Interactive Mini Month Date Picker */}
            <OrionCalendarMiniMonth
              selectedDate={currentDate}
              onSelectDate={(newDate) => setCurrentDate(newDate)}
            />

            {/* Calendars List */}
            <div className="p-4 bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2c2c2c] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Mis Calendarios
                </span>
                <button
                  onClick={() => setIsNewCalendarOpen(true)}
                  className="p-1 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                  title="Crear calendario"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* All calendars button */}
              <button
                onClick={() => setActiveCalendarId('all')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeCalendarId === 'all'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#252525]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Layers className="w-3.5 h-3.5" />
                  <span className="truncate">Todos los calendarios</span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-neutral-400">
                  {events.length}
                </span>
              </button>

              {/* Individual calendars list */}
              <div className="space-y-1">
                {calendars.map((cal) => {
                  const isSelected = activeCalendarId === cal.id;
                  const calEventsCount = events.filter((e) => e.calendarId === cal.id).length;

                  return (
                    <button
                      key={cal.id}
                      onClick={() => setActiveCalendarId(cal.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-100 dark:bg-[#282828] font-semibold text-neutral-900 dark:text-neutral-100'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#252525]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cal.color }}
                        />
                        <span className="truncate">{cal.name}</span>
                      </div>
                      <span className="text-[10px] font-mono tabular-nums text-neutral-400 shrink-0 ml-1">
                        {calEventsCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Import ICS button */}
              <button
                onClick={() => setIsImportICSOpen(true)}
                className="w-full mt-2 pt-2 border-t border-[#f0f0ee] dark:border-[#2a2a2a] flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white font-medium cursor-pointer transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Importar archivo .ics</span>
              </button>
            </div>

            {/* Deep Interop: Quick jump to Orion Tasks Card */}
            <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-[#212027] dark:to-[#1c1a24] rounded-xl border border-indigo-100/80 dark:border-indigo-950/60 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <CheckSquare className="w-4 h-4" />
                <h4 className="text-xs font-bold">Orion Tasks</h4>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Gestiona tus tareas del calendario en el tablero Kanban y toma notas vinculadas.
              </p>
              <button
                onClick={() => setCurrentApp('tasks')}
                className="w-full mt-1 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-300 dark:bg-indigo-950 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
              >
                Abrir Orion Tasks →
              </button>
            </div>
          </aside>

          {/* Main Calendar View Area */}
          <main className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="w-full flex"
              >
                {viewMode === 'week' && (
                  <OrionCalendarWeekView
                    currentDate={currentDate}
                    onOpenNewEvent={handleOpenNewEvent}
                  />
                )}
                {viewMode === 'month' && (
                  <OrionCalendarMonthView
                    currentDate={currentDate}
                    onOpenNewEvent={handleOpenNewEvent}
                  />
                )}
                {viewMode === 'day' && (
                  <OrionCalendarDayView
                    currentDate={currentDate}
                    onOpenNewEvent={handleOpenNewEvent}
                  />
                )}
                {viewMode === 'agenda' && (
                  <OrionCalendarAgendaView onOpenNewEvent={handleOpenNewEvent} />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Subtle Notion-Style Footer */}
      <footer className="border-t border-[#f0f0ee] dark:border-[#252525] py-4 px-6 text-center text-[11px] text-neutral-400 dark:text-neutral-600 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Orion Workspace</span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="font-medium text-neutral-600 dark:text-neutral-300">Orion Calendar</span>
            <span className="px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-blue-600 dark:text-blue-400 rounded">
              /calendar
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span className={isCloudSynced ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
              {isCloudSynced ? '● Guardado en Google Account (Firestore)' : 'Modo local activo'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EventDetailModal />
      <NewEventModal
        isOpen={isNewEventOpen}
        onClose={() => {
          setIsNewEventOpen(false);
          setPrefilledDateForEvent(null);
        }}
        prefillDate={prefilledDateForEvent}
      />
      <NewCalendarModal isOpen={isNewCalendarOpen} onClose={() => setIsNewCalendarOpen(false)} />
      <ImportICSModal isOpen={isImportICSOpen} onClose={() => setIsImportICSOpen(false)} />
      <OrionWorkspaceModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />
    </div>
  );
};
