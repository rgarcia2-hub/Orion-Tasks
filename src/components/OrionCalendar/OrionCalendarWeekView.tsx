import React, { useMemo } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarEvent } from '../../types/calendar';
import {
  getWeekDays,
  isSameDay,
  formatDateKey,
  formatEventTimeRange,
  formatEventShortTime,
} from '../../utils/calendarData';
import { Video, Clock, MapPin, Plus } from 'lucide-react';
import { motion } from 'motion/react';

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

      {/* Week Grid Body with Scroll */}
      <div className="relative flex-1 overflow-y-auto max-h-[calc(100vh-210px)] min-h-[580px]">
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

            // Get events that start on this day
            const dayEvents = filteredEvents.filter((evt) => {
              try {
                const evtDate = new Date(evt.startDateTime);
                return isSameDay(evtDate, day);
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
                {dayEvents.map((evt) => {
                  const startDate = new Date(evt.startDateTime);
                  const endDate = new Date(evt.endDateTime);
                  const startHourDec = startDate.getHours() + startDate.getMinutes() / 60;
                  const endHourDec = endDate.getHours() + endDate.getMinutes() / 60;
                  const duration = Math.max(0.5, endHourDec - startHourDec);

                  // Calculate position
                  const clampedStart = Math.max(START_HOUR, startHourDec);
                  const topPercent = ((clampedStart - START_HOUR) / TOTAL_HOURS) * 100;
                  const heightPercent = (duration / TOTAL_HOURS) * 100;

                  return (
                    <motion.div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventForDetail(evt);
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02, zIndex: 30 }}
                      className="absolute left-1 right-1 rounded-lg p-2 overflow-hidden shadow-xs border transition-all cursor-pointer text-left select-none group"
                      style={{
                        top: `${topPercent}%`,
                        height: `${Math.max(34, heightPercent)}%`,
                        minHeight: '34px',
                        backgroundColor: `${evt.calendarColor}18`,
                        borderColor: `${evt.calendarColor}60`,
                        borderLeftWidth: '4px',
                        borderLeftColor: evt.calendarColor,
                      }}
                    >
                      <div className="flex items-start justify-between gap-1 min-w-0">
                        <span
                          className="text-xs font-semibold truncate leading-tight"
                          style={{ color: evt.calendarColor }}
                        >
                          {evt.title}
                        </span>
                        {evt.meetLink && (
                          <Video className="w-3 h-3 text-indigo-500 shrink-0" />
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center gap-1 text-[10px] font-mono text-neutral-600 dark:text-neutral-400 truncate">
                        <Clock className="w-2.5 h-2.5 shrink-0 opacity-60" />
                        <span>{formatEventShortTime(evt.startDateTime)} - {formatEventShortTime(evt.endDateTime)}</span>
                      </div>

                      {evt.location && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          <MapPin className="w-2.5 h-2.5 shrink-0 opacity-60" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
