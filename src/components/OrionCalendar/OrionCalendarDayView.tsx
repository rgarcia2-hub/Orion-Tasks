import React from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarEvent } from '../../types/calendar';
import {
  isSameDay,
  formatDateKey,
  formatEventTimeRange,
  formatEventShortTime,
  getCountdownString,
  isAllDayEvent,
} from '../../utils/calendarData';
import {
  Clock,
  Video,
  MapPin,
  Users,
  Copy,
  Plus,
  ExternalLink,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { motion } from 'motion/react';

interface OrionCalendarDayViewProps {
  currentDate: Date;
  onOpenNewEvent: (datePrefill?: string) => void;
}

const START_HOUR = 7;
const END_HOUR = 22;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export const OrionCalendarDayView: React.FC<OrionCalendarDayViewProps> = ({
  currentDate,
  onOpenNewEvent,
}) => {
  const {
    events,
    activeCalendarId,
    setSelectedEventForDetail,
    duplicateEventToApp,
    isClonedInApp,
  } = useCalendar();

  const dateStr = formatDateKey(currentDate);
  const isToday = isSameDay(currentDate, new Date());

  const dayEvents = events
    .filter((evt) => {
      if (activeCalendarId !== 'all' && evt.calendarId !== activeCalendarId) {
        return false;
      }
      try {
        return isSameDay(new Date(evt.startDateTime), currentDate);
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

  const handleDuplicateToTasks = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    try {
      duplicateEventToApp(evt.id, 'medium', 'pending');
    } catch {
      // Handled via toast
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
      {/* Main Hourly Timeline (2 columns) */}
      <div className="lg:col-span-2 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-neutral-50/50 dark:bg-[#232323] flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Vista Diaria
            </span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 capitalize">
              {currentDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>
          </div>
          <button
            onClick={() => onOpenNewEvent(`${dateStr}T09:00:00`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Evento</span>
          </button>
        </div>

        {/* All Day Events Banner if any exist on this day */}
        {dayEvents.some(isAllDayEvent) && (
          <div className="px-4 py-2.5 bg-neutral-50/80 dark:bg-[#232323] border-b border-[#e9e9e7] dark:border-[#2e2e2e] flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mr-1 select-none">
              Todo el día:
            </span>
            {dayEvents.filter(isAllDayEvent).map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEventForDetail(evt)}
                className="px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer shadow-2xs border transition-all hover:scale-[1.02] flex items-center gap-1.5"
                style={{
                  backgroundColor: `${evt.calendarColor}20`,
                  borderColor: `${evt.calendarColor}50`,
                  color: evt.calendarColor,
                  borderLeftWidth: '3px',
                  borderLeftColor: evt.calendarColor,
                }}
              >
                <span>{evt.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* Hourly rows */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-250px)] p-4 space-y-2">
          {HOURS.map((hour) => {
            const hourEvents = dayEvents.filter((evt) => {
              if (isAllDayEvent(evt)) return false;
              const d = new Date(evt.startDateTime);
              return d.getHours() === hour;
            });

            return (
              <div
                key={hour}
                className="flex items-start gap-3 group/hour min-h-[58px] pt-1 border-t border-[#f0f0ee] dark:border-[#282828] first:border-t-0"
              >
                {/* Time Gutter */}
                <span className="w-12 text-right text-[11px] font-mono text-neutral-400 dark:text-neutral-500 shrink-0 pt-0.5">
                  {String(hour).padStart(2, '0')}:00
                </span>

                {/* Events in this hour slot */}
                <div className="flex-1 space-y-2">
                  {hourEvents.length > 0 ? (
                    hourEvents.map((evt) => (
                      <motion.div
                        key={evt.id}
                        onClick={() => setSelectedEventForDetail(evt)}
                        whileHover={{ y: -1 }}
                        className="p-3 rounded-xl border shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        style={{
                          backgroundColor: `${evt.calendarColor}12`,
                          borderColor: `${evt.calendarColor}45`,
                          borderLeftWidth: '4px',
                          borderLeftColor: evt.calendarColor,
                        }}
                      >
                        <div className="min-w-0">
                          <h4
                            className="text-xs font-bold truncate group-hover:underline"
                            style={{ color: evt.calendarColor }}
                          >
                            {evt.title}
                          </h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              {formatEventTimeRange(evt.startDateTime, evt.endDateTime)}
                            </span>
                            {evt.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-neutral-400" />
                                {evt.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {evt.meetLink && (
                            <a
                              href={evt.meetLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                            >
                              <Video className="w-3 h-3" />
                              <span>Meet</span>
                            </a>
                          )}
                          <button
                            onClick={(e) => handleDuplicateToTasks(e, evt)}
                            disabled={isClonedInApp(evt.id)}
                            title="Convertir a tarea en Orion Tasks"
                            className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                              isClonedInApp(evt.id)
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-white dark:bg-[#282828] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                            }`}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <button
                      onClick={() => onOpenNewEvent(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`)}
                      className="opacity-0 group-hover/hour:opacity-100 text-[11px] text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 font-medium transition-opacity py-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Añadir a las {String(hour).padStart(2, '0')}:00</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Pane: Day Agenda and Meeting Links (1 column) */}
      <div className="space-y-4">
        {/* Day Events Card */}
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-[#e9e9e7] dark:border-[#2e2e2e] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#f0f0ee] dark:border-[#2a2a2a]">
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Agenda del Día
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {dayEvents.length} eventos programados
              </p>
            </div>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Hoy
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {dayEvents.length > 0 ? (
              dayEvents.map((evt) => {
                const countdown = getCountdownString(evt.startDateTime);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEventForDetail(evt)}
                    className="p-3 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525] hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className="text-[11px] font-semibold truncate block"
                          style={{ color: evt.calendarColor }}
                        >
                          {evt.title}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                          {formatEventShortTime(evt.startDateTime)} - {formatEventShortTime(evt.endDateTime)}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          countdown.isImminent
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-semibold animate-pulse'
                            : countdown.isPast
                            ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {countdown.text}
                      </span>
                    </div>

                    {evt.meetLink && (
                      <div className="mt-2.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Video className="w-3 h-3 text-indigo-500" />
                          Google Meet
                        </span>
                        <a
                          href={evt.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                        >
                          <span>Unirse</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span>No hay eventos programados para este día.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
