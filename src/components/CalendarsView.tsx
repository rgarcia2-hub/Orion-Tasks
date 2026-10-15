import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEvent } from '../types/calendar';
import { formatEventTimeRange, isEventExpired } from '../utils/calendarData';
import { GoogleAuthButton } from './GoogleAuthButton';
import { VisualCalendarGrid } from './VisualCalendarGrid';
import { ColorPickerPopover } from './ColorPickerPopover';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Search,
  Plus,
  Video,
  MapPin,
  Users,
  Copy,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  List,
  Star,
  Zap,
  Clock,
} from 'lucide-react';

interface CalendarsViewProps {
  onOpenNewCalendar: () => void;
  onOpenNewEvent: (datePrefill?: string) => void;
}

export const CalendarsView: React.FC<CalendarsViewProps> = ({
  onOpenNewCalendar,
  onOpenNewEvent,
}) => {
  const {
    calendars,
    activeCalendarId,
    setActiveCalendarId,
    defaultCalendarId,
    setDefaultCalendar,
    events,
    setSelectedEventForDetail,
    duplicateEventToApp,
    isClonedInApp,
    isGoogleConnected,
    user,
    isLoadingGoogle,
    refreshGoogleData,
    googleSyncError,
    updateCalendarColor,
  } = useCalendar();

  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Filter events based on activeCalendarId, search, and period
  const filteredEvents = events.filter((evt) => {
    if (activeCalendarId !== 'all' && evt.calendarId !== activeCalendarId) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = evt.title.toLowerCase().includes(q);
      const matchDesc = evt.description?.toLowerCase().includes(q);
      const matchLoc = evt.location?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }

    const now = Date.now();
    const eventEnd = new Date(evt.endDateTime).getTime();
    if (filterPeriod === 'upcoming' && eventEnd < now) return false;
    if (filterPeriod === 'past' && eventEnd >= now) return false;

    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const timeA = new Date(a.startDateTime).getTime();
    const timeB = new Date(b.startDateTime).getTime();
    return filterPeriod === 'past' ? timeB - timeA : timeA - timeB;
  });

  const activeCalendar = calendars.find((c) => c.id === activeCalendarId);

  const handleDuplicate = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    try {
      duplicateEventToApp(evt.id, 'medium', 'pending');
    } catch {
      // Handled via toast in CalendarContext
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto px-6 py-8 space-y-6"
    >
      {/* Google Calendar Connection Banner */}
      {!isGoogleConnected ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 sm:p-5 rounded-2xl border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Conecta tus calendarios reales de Google
              </h3>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
              Inicia sesión con tu cuenta de Google para cargar automáticamente todos tus calendarios personales, de trabajo y eventos reales en la app.
            </p>
          </div>
          <div className="shrink-0">
            <GoogleAuthButton />
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 px-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-neutral-700 dark:text-neutral-300">
              Conectado a Google Calendar como <strong>{user?.email}</strong>
            </span>
          </div>

          <button
            onClick={refreshGoogleData}
            disabled={isLoadingGoogle}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingGoogle ? 'animate-spin' : ''}`} />
            <span>Sincronizar ahora</span>
          </button>
        </motion.div>
      )}

      {googleSyncError && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{googleSyncError}</span>
        </div>
      )}

      {/* View Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Calendarios y Eventos
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Explora tus eventos en formato visual de cuadrícula o lista, con colores personalizables y auto-duplicación al calendario predeterminado.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Mode switch */}
          <div className="flex items-center gap-1 p-1 bg-[#f4f4f2] dark:bg-[#252525] rounded-lg">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                displayMode === 'grid'
                  ? 'bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Calendario Visual</span>
            </button>

            <button
              onClick={() => setDisplayMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                displayMode === 'list'
                  ? 'bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista Agenda</span>
            </button>
          </div>

          <button
            onClick={onOpenNewCalendar}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 border border-[#e0e0de] dark:border-[#333333] rounded-lg hover:bg-neutral-50 dark:hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Calendario</span>
          </button>
          <button
            onClick={() => onOpenNewEvent()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Evento</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Calendars Sidebar (4 cols) + Visual Calendar / Agenda (8 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Calendars Sidebar */}
        <div className="md:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-1 flex items-center justify-between">
            <span>Tus Calendarios ({calendars.length})</span>
            <span className="text-[10px] text-neutral-400 normal-case">
              ⭐ Predeterminado
            </span>
          </div>

          <div className="bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] p-2 space-y-1.5 shadow-xs">
            {/* "All Calendars" Option */}
            <button
              onClick={() => setActiveCalendarId('all')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                activeCalendarId === 'all'
                  ? 'bg-neutral-100 dark:bg-[#2c2c2c] text-neutral-900 dark:text-neutral-100 font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-[#fafaf8] dark:hover:bg-[#252525]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />
                </div>
                <span>Todos los calendarios</span>
              </div>
              <span className="font-mono tabular-nums text-[11px] text-neutral-400">
                {events.length}
              </span>
            </button>

            {/* Individual Calendars with Default selector & color popover */}
            {calendars.map((cal) => {
              const calEventCount = events.filter((e) => e.calendarId === cal.id).length;
              const isSelected = activeCalendarId === cal.id;
              const isDefault = defaultCalendarId === cal.id;

              return (
                <motion.div
                  key={cal.id}
                  layout
                  onClick={() => setActiveCalendarId(cal.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                    isSelected
                      ? 'bg-neutral-100 dark:bg-[#2c2c2c] text-neutral-900 dark:text-neutral-100 font-semibold'
                      : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-[#fafaf8] dark:hover:bg-[#252525]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <ColorPickerPopover
                      currentColor={cal.color}
                      onSelectColor={(newHex) => updateCalendarColor(cal.id, newHex)}
                    />

                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate">{cal.name}</span>
                        {isDefault && (
                          <span
                            title="Calendario predeterminado: sus eventos se duplican automáticamente a la app"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 shrink-0"
                          >
                            <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>Auto-duplica</span>
                          </span>
                        )}
                      </div>
                      {cal.description && (
                        <div className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate font-normal">
                          {cal.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {/* Button to set as default calendar */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefaultCalendar(cal.id);
                      }}
                      title={
                        isDefault
                          ? 'Calendario predeterminado (activo)'
                          : 'Hacer este calendario el predeterminado para auto-duplicar eventos'
                      }
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        isDefault
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-neutral-300 dark:text-neutral-600 hover:text-amber-500 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isDefault ? 'fill-amber-400' : ''}`} />
                    </button>

                    <span className="font-mono tabular-nums text-[11px] text-neutral-400">
                      {calEventCount}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Active Calendar Details Card */}
          {activeCalendar && (
            <motion.div
              layout
              className="p-3.5 rounded-xl bg-[#fafaf8] dark:bg-[#1a1a1a] border border-[#e9e9e7] dark:border-[#2e2e2e] text-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium text-neutral-800 dark:text-neutral-200">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activeCalendar.color }}
                  />
                  <span>{activeCalendar.name}</span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <span>Color:</span>
                  <ColorPickerPopover
                    currentColor={activeCalendar.color}
                    onSelectColor={(hex) => updateCalendarColor(activeCalendar.id, hex)}
                  />
                </div>
              </div>

              {activeCalendar.description && (
                <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
                  {activeCalendar.description}
                </p>
              )}

              {/* Set as Default button */}
              <div className="pt-2 border-t border-[#f0f0ee] dark:border-[#282828] flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Auto-duplicar en la app:</span>
                {defaultCalendarId === activeCalendar.id ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>Predeterminado</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setDefaultCalendar(activeCalendar.id)}
                    className="px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Establecer como Default
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Educational Callout regarding auto-duplication */}
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#1c1c1c] text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong>Auto-duplicación inteligente:</strong> Cualquier evento que crees o que sincronices de tu calendario marcado como <em>Default</em> se agregará automáticamente al tablero Kanban de la app.
            </div>
          </div>
        </div>

        {/* Calendar View Area (8 cols) */}
        <div className="md:col-span-8 space-y-4">
          <AnimatePresence mode="wait">
            {displayMode === 'grid' ? (
              <motion.div
                key="grid-view"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.15 }}
              >
                <VisualCalendarGrid onOpenNewEventForDate={onOpenNewEvent} />
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#202020] p-2.5 rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Buscar eventos por título, detalle o sala..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-0.5 bg-[#f4f4f2] dark:bg-[#2a2a2a] rounded-lg shrink-0">
                    <button
                      onClick={() => setFilterPeriod('upcoming')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                        filterPeriod === 'upcoming'
                          ? 'bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                      }`}
                    >
                      Próximos
                    </button>
                    <button
                      onClick={() => setFilterPeriod('all')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                        filterPeriod === 'all'
                          ? 'bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFilterPeriod('past')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                        filterPeriod === 'past'
                          ? 'bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                      }`}
                    >
                      Pasados
                    </button>
                  </div>
                </div>

                {/* Events List */}
                <div className="bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] divide-y divide-[#f0f0ee] dark:divide-[#2a2a2a] overflow-hidden shadow-xs">
                  {sortedEvents.length > 0 ? (
                    sortedEvents.map((evt) => {
                      const cloned = isClonedInApp(evt.id);

                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEventForDetail(evt)}
                          className="p-4 hover:bg-[#fafaf8] dark:hover:bg-[#252525] transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: evt.calendarColor }}
                              />
                              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                                {evt.calendarName}
                              </span>
                              <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-600">
                                ·
                              </span>
                              <span className="font-mono text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
                                {formatEventTimeRange(evt.startDateTime, evt.endDateTime)}
                              </span>
                            </div>

                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {evt.title}
                            </h3>

                            {evt.description && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                {evt.description}
                              </p>
                            )}

                            <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-400 dark:text-neutral-500 flex-wrap">
                              {evt.location && (
                                <span className="flex items-center gap-1 truncate max-w-[200px]">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{evt.location}</span>
                                </span>
                              )}
                              {evt.meetLink && (
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                                  <Video className="w-3 h-3" />
                                  <span>Meet</span>
                                </span>
                              )}
                              {evt.attendees && evt.attendees.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{evt.attendees.length}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            {isEventExpired(evt.endDateTime, evt.startDateTime, evt.isAllDay) ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Vencido</span>
                              </span>
                            ) : cloned ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Duplicado</span>
                              </span>
                            ) : (
                              <button
                                onClick={(e) => handleDuplicate(e, evt)}
                                title="Duplicar evento en el calendario y gestor de tareas de la app"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 border border-[#e0e0de] dark:border-[#333333] hover:bg-neutral-100 dark:hover:bg-[#2e2e2e] rounded-lg transition-all cursor-pointer shadow-2xs"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Duplicar a App</span>
                              </button>
                            )}

                            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors" />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center space-y-2">
                      <CalendarIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        No hay eventos en la agenda
                      </p>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                        {isGoogleConnected
                          ? 'No se encontraron eventos en este calendario o periodo.'
                          : 'Puedes conectar tu cuenta de Google arriba o crear tu primer evento con el botón "Añadir Evento".'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
