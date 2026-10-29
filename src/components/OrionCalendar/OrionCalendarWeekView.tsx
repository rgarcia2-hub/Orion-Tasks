import React, { useMemo, useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarEvent } from '../../types/calendar';
import {
  getWeekDays,
  isSameDay,
  formatDateKey,
  formatEventTimeRange,
  formatEventShortTime,
  isAllDayEvent,
} from '../../utils/calendarData';
import { Video, Clock, MapPin, Plus, AlertTriangle, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrionCalendarWeekViewProps {
  currentDate: Date;
  onOpenNewEvent: (datePrefill?: string) => void;
}

const START_HOUR = 7;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR + 1;
const HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

export const OrionCalendarWeekView: React.FC<OrionCalendarWeekViewProps> = ({
  currentDate,
  onOpenNewEvent,
}) => {
  const {
    events,
    activeCalendarId,
    setSelectedEventForDetail,
    updateEvent,
  } = useCalendar();

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Filter events by calendar
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (activeCalendarId !== 'all' && evt.calendarId !== activeCalendarId) {
        return false;
      }
      return true;
    });
  }, [events, activeCalendarId]);

  // Events without defined hour in the current visible week
  const pendingEventsThisWeek = useMemo(() => {
    return filteredEvents.filter((evt) => {
      if (!isAllDayEvent(evt)) return false;
      try {
        const start = new Date(evt.startDateTime);
        const end = new Date(evt.endDateTime);
        return weekDays.some((day) => isSameDay(start, day) || (start <= day && end >= day));
      } catch {
        return false;
      }
    });
  }, [filteredEvents, weekDays]);

  // State for active inline custom time entry
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customStartTime, setCustomStartTime] = useState<string>('09:00');
  const [customDuration, setCustomDuration] = useState<number>(1);

  const handleQuickAssignHour = (
    evt: CalendarEvent,
    startHourStr: string,
    durationHours = 1
  ) => {
    try {
      const baseDate = new Date(evt.startDateTime);
      const dateKey = formatDateKey(baseDate);
      const [hh, mm] = startHourStr.split(':').map((v) => parseInt(v, 10));

      const startObj = new Date(`${dateKey}T${String(hh).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}:00`);
      const endObj = new Date(startObj.getTime() + durationHours * 60 * 60 * 1000);

      updateEvent(evt.id, {
        startDateTime: startObj.toISOString(),
        endDateTime: endObj.toISOString(),
        isAllDay: false,
      });
      setEditingCustomId(null);
    } catch (err) {
      console.error('Error assigning time:', err);
    }
  };

  // Current time position
  const now = new Date();
  const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
  const isNowWithinHours = currentHourDecimal >= START_HOUR && currentHourDecimal <= END_HOUR + 1;
  const currentTimeTopPercent = isNowWithinHours
    ? ((currentHourDecimal - START_HOUR) / TOTAL_HOURS) * 100
    : null;

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs overflow-hidden">
      {/* 7 Days Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-neutral-50/60 dark:bg-[#232323] sticky top-0 z-20">
        {/* Time Gutter corner */}
        <div className="p-3 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 border-r border-[#e9e9e7] dark:border-[#2e2e2e] flex items-center justify-center">
          GMT
        </div>

        {/* Day Column Headers */}
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, today);
          const dayDate = day.getDate();

          return (
            <div
              key={idx}
              className={`py-3 px-2 text-center border-r border-[#e9e9e7] dark:border-[#2e2e2e] last:border-r-0 transition-colors ${
                isToday ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {dayNames[idx].slice(0, 3)}
              </div>
              <div className="mt-1 flex items-center justify-center">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold font-mono transition-colors ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800'
                  }`}
                >
                  {dayDate}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mini Sección: Eventos sin hora definida (solo aparece si hay eventos pendientes) */}
      <AnimatePresence>
        {pendingEventsThisWeek.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="border-b border-amber-200/80 dark:border-amber-900/60 bg-gradient-to-r from-amber-50/80 via-amber-50/40 to-amber-50/80 dark:from-amber-950/30 dark:via-amber-950/15 dark:to-amber-950/30 px-4 py-2.5 z-10 shrink-0 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Eventos pendientes de definir hora
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                  {pendingEventsThisWeek.length} {pendingEventsThisWeek.length === 1 ? 'pendiente' : 'pendientes'}
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Pulsa una hora rápida para ubicar el evento en la cuadrícula semanal
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-0.5">
              {pendingEventsThisWeek.map((evt) => {
                const evtDate = new Date(evt.startDateTime);
                const isCustomOpen = editingCustomId === evt.id;

                return (
                  <motion.div
                    key={evt.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-[#242424] border border-amber-200/90 dark:border-neutral-700 shadow-2xs hover:shadow-xs transition-all text-xs"
                  >
                    {/* Event Info Clickable */}
                    <div
                      onClick={() => setSelectedEventForDetail(evt)}
                      className="flex items-center gap-2 cursor-pointer max-w-[210px] truncate group"
                      title="Clic para ver detalles completos del evento"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: evt.calendarColor }}
                      />
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {evt.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 shrink-0 font-medium">
                        ({evtDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })})
                      </span>
                    </div>

                    <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 hidden sm:block shrink-0" />

                    {/* Quick Scheduling Controls */}
                    {!isCustomOpen ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mr-0.5">
                          Horario:
                        </span>
                        <button
                          onClick={() => handleQuickAssignHour(evt, '08:00', 1)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-100 hover:bg-amber-100 dark:bg-[#303030] dark:hover:bg-amber-950/70 text-neutral-700 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700 hover:border-amber-400/60"
                          title="Asignar de 08:00 a 09:00"
                        >
                          08:00
                        </button>
                        <button
                          onClick={() => handleQuickAssignHour(evt, '09:00', 1)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-100 hover:bg-amber-100 dark:bg-[#303030] dark:hover:bg-amber-950/70 text-neutral-700 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700 hover:border-amber-400/60"
                          title="Asignar de 09:00 a 10:00"
                        >
                          09:00
                        </button>
                        <button
                          onClick={() => handleQuickAssignHour(evt, '11:00', 1)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-100 hover:bg-amber-100 dark:bg-[#303030] dark:hover:bg-amber-950/70 text-neutral-700 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700 hover:border-amber-400/60"
                          title="Asignar de 11:00 a 12:00"
                        >
                          11:00
                        </button>
                        <button
                          onClick={() => handleQuickAssignHour(evt, '15:00', 1)}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-neutral-100 hover:bg-amber-100 dark:bg-[#303030] dark:hover:bg-amber-950/70 text-neutral-700 dark:text-neutral-300 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700 hover:border-amber-400/60"
                          title="Asignar de 15:00 a 16:00"
                        >
                          15:00
                        </button>
                        <button
                          onClick={() => {
                            setEditingCustomId(evt.id);
                            setCustomStartTime('09:00');
                            setCustomDuration(1);
                          }}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-[#303030] dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
                          title="Elegir otra hora personalizada"
                        >
                          + Otra
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap bg-amber-50/90 dark:bg-amber-950/60 p-1 rounded-lg border border-amber-300 dark:border-amber-700">
                        <input
                          type="time"
                          value={customStartTime}
                          onChange={(e) => setCustomStartTime(e.target.value)}
                          className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-600 text-xs font-mono text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <select
                          value={customDuration}
                          onChange={(e) => setCustomDuration(parseFloat(e.target.value))}
                          className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1a1a1a] border border-neutral-300 dark:border-neutral-600 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value={0.5}>30 min</option>
                          <option value={1}>1 hora</option>
                          <option value={1.5}>1.5 h</option>
                          <option value={2}>2 horas</option>
                          <option value={3}>3 horas</option>
                        </select>
                        <button
                          onClick={() => handleQuickAssignHour(evt, customStartTime, customDuration)}
                          className="px-2.5 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Fijar</span>
                        </button>
                        <button
                          onClick={() => setEditingCustomId(null)}
                          className="px-1 py-0.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Week Grid Body with Scroll */}
      <div className="relative flex-1 overflow-y-auto max-h-[calc(100vh-250px)] min-h-[580px]">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: `${HOURS.length * 64}px` }}>
          {/* Time Gutter Column */}
          <div className="border-r border-[#e9e9e7] dark:border-[#2e2e2e] bg-neutral-50/30 dark:bg-[#1f1f1f] select-none">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 text-right pr-2 text-[11px] font-mono text-neutral-400 dark:text-neutral-500 -translate-y-2 border-b border-transparent"
              >
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 7 Columns for Days */}
          {weekDays.map((day, dayIndex) => {
            const isToday = isSameDay(day, today);
            const dateStr = formatDateKey(day);

            // Only timed events (not all-day) are rendered inside the hourly grid
            const timedEvents = filteredEvents.filter((evt) => {
              try {
                const evtDate = new Date(evt.startDateTime);
                return isSameDay(evtDate, day) && !isAllDayEvent(evt);
              } catch {
                return false;
              }
            });

            return (
              <div
                key={dayIndex}
                className={`relative border-r border-[#e9e9e7] dark:border-[#2e2e2e] last:border-r-0 ${
                  isToday ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                }`}
              >
                {/* Horizontal Hourly Lines & Clickable Slots */}
                {HOURS.map((hour) => {
                  const prefillIso = `${dateStr}T${String(hour).padStart(2, '0')}:00:00`;
                  return (
                    <div
                      key={hour}
                      onClick={() => onOpenNewEvent(prefillIso)}
                      className="h-16 border-b border-[#f0f0ee] dark:border-[#282828] group/slot relative hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                    >
                      <span className="hidden group-hover/slot:inline-flex items-center gap-1 absolute top-1 left-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium z-10 pointer-events-none">
                        <Plus className="w-2.5 h-2.5" />
                        <span>{String(hour).padStart(2, '0')}:00</span>
                      </span>
                    </div>
                  );
                })}

                {/* Real-time Indicator Line if Today */}
                {isToday && currentTimeTopPercent !== null && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    style={{ top: `${currentTimeTopPercent}%` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 dark:ring-rose-950 -ml-1.5 shrink-0 animate-pulse" />
                    <div className="h-0.5 bg-rose-500 w-full shadow-xs" />
                  </div>
                )}

                {/* Rendered Event Blocks positioned proportionally */}
                {(() => {
                  const items = timedEvents.map((evt) => {
                    const startDate = new Date(evt.startDateTime);
                    const endDate = new Date(evt.endDateTime);
                    const startHourDec = startDate.getHours() + startDate.getMinutes() / 60;
                    const endHourDec = endDate.getHours() + endDate.getMinutes() / 60;

                    let durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
                    if (isNaN(durationHours) || durationHours <= 0) {
                      durationHours = 1;
                    }

                    const clampedStart = Math.max(START_HOUR, Math.min(END_HOUR + 0.8, startHourDec));
                    const topPx = (clampedStart - START_HOUR) * 64;

                    // Ensure height cannot exceed remaining hours in grid
                    const maxAllowedHours = (END_HOUR + 1) - clampedStart;
                    const visibleHours = Math.max(0.4, Math.min(durationHours, maxAllowedHours));
                    const heightPx = Math.max(26, visibleHours * 64 - 2);

                    return {
                      evt,
                      startHourDec,
                      endHourDec,
                      clampedStart,
                      durationHours: visibleHours,
                      topPx,
                      heightPx,
                    };
                  });

                  return items.map((item) => {
                    const { evt, topPx, heightPx, startHourDec, endHourDec } = item;

                    // Detect overlap with any other event on this day
                    const overlapping = items.filter(
                      (other) =>
                        other.evt.id !== evt.id &&
                        startHourDec < other.endHourDec &&
                        other.startHourDec < endHourDec
                    );
                    const hasConflict = overlapping.length > 0;

                    let leftStyle = '4px';
                    let widthStyle = 'calc(100% - 8px)';
                    if (hasConflict) {
                      const group = [item, ...overlapping].sort((a, b) => a.evt.id.localeCompare(b.evt.id));
                      const totalCols = group.length;
                      const colIndex = group.findIndex((g) => g.evt.id === evt.id);
                      const widthPercent = 100 / totalCols;
                      leftStyle = `calc(${colIndex * widthPercent}% + 2px)`;
                      widthStyle = `calc(${widthPercent}% - 4px)`;
                    }

                    const isCompact = heightPx < 46;

                    return (
                      <motion.div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForDetail(evt);
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.01, zIndex: 30 }}
                        className="absolute rounded-lg p-1.5 overflow-hidden shadow-xs border transition-all cursor-pointer text-left select-none group"
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          left: leftStyle,
                          width: widthStyle,
                          backgroundColor: `${evt.calendarColor}18`,
                          borderColor: hasConflict ? '#f59e0b' : `${evt.calendarColor}60`,
                          borderLeftWidth: '4px',
                          borderLeftColor: hasConflict ? '#f59e0b' : evt.calendarColor,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1 min-w-0">
                          <span
                            className="text-xs font-semibold truncate leading-tight"
                            style={{ color: evt.calendarColor }}
                          >
                            {evt.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {hasConflict && (
                              <span
                                title="Conflicto de horario: se solapa con otro evento"
                                className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[9px] flex items-center gap-0.5"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span className="hidden sm:inline">Solape</span>
                              </span>
                            )}
                            {evt.meetLink && (
                              <Video className="w-3 h-3 text-indigo-500 shrink-0" />
                            )}
                          </div>
                        </div>

                        {!isCompact && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 truncate">
                            <Clock className="w-2.5 h-2.5 shrink-0 opacity-60" />
                            <span>{formatEventShortTime(evt.startDateTime)} - {formatEventShortTime(evt.endDateTime)}</span>
                          </div>
                        )}

                        {!isCompact && heightPx >= 64 && evt.location && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                            <MapPin className="w-2.5 h-2.5 shrink-0 opacity-60" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  });
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
