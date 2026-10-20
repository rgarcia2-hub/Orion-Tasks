import React from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarEvent } from '../../types/calendar';
import { getMonthMatrix, formatEventShortTime, isEventOnDate } from '../../utils/calendarData';
import { motion } from 'motion/react';
import { Video, Plus } from 'lucide-react';

interface OrionCalendarMonthViewProps {
  currentDate: Date;
  onOpenNewEvent: (datePrefill?: string) => void;
}

export const OrionCalendarMonthView: React.FC<OrionCalendarMonthViewProps> = ({
  currentDate,
  onOpenNewEvent,
}) => {
  const {
    events,
    activeCalendarId,
    setSelectedEventForDetail,
  } = useCalendar();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const filteredEvents = events.filter((evt) => {
    if (activeCalendarId !== 'all' && evt.calendarId !== activeCalendarId) {
      return false;
    }
    return true;
  });

  const daysMatrix = getMonthMatrix(year, month);

  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-neutral-50/60 dark:bg-[#232323]">
        {weekDays.map((dayName, idx) => (
          <div
            key={idx}
            className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-r border-[#e9e9e7] dark:border-[#2e2e2e] last:border-r-0"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Month Days Matrix */}
      <div className="grid grid-cols-7 auto-rows-fr flex-1 divide-x divide-y divide-[#e9e9e7] dark:divide-[#2e2e2e]">
        {daysMatrix.map((item, idx) => {
          const dayEvents = filteredEvents.filter((evt) => isEventOnDate(evt, item.dateKey));
          const isToday = item.isToday;

          return (
            <div
              key={idx}
              onClick={() => onOpenNewEvent(`${item.dateKey}T09:00:00`)}
              className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors group/cell relative cursor-pointer ${
                !item.isCurrentMonth
                  ? 'bg-neutral-50/40 dark:bg-[#1b1b1b] text-neutral-400 dark:text-neutral-600'
                  : 'bg-white dark:bg-[#1e1e1e] text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50/60 dark:hover:bg-[#242424]'
              }`}
            >
              {/* Top Row: Date Number & Quick Add */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-medium ${
                    isToday
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {item.date.getDate()}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNewEvent(`${item.dateKey}T09:00:00`);
                  }}
                  className="opacity-0 group-hover/cell:opacity-100 p-1 text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-opacity"
                  title="Añadir evento en este día"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Event chips */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] no-scrollbar">
                {dayEvents.slice(0, 3).map((evt) => (
                  <motion.div
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventForDetail(evt);
                    }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium truncate shadow-2xs border transition-all cursor-pointer group/evt"
                    style={{
                      backgroundColor: `${evt.calendarColor}14`,
                      borderColor: `${evt.calendarColor}40`,
                      borderLeftWidth: '3px',
                      borderLeftColor: evt.calendarColor,
                    }}
                  >
                    <span
                      className="font-mono text-[10px] shrink-0 tabular-nums"
                      style={{ color: evt.calendarColor }}
                    >
                      {formatEventShortTime(evt.startDateTime)}
                    </span>
                    <span className="truncate text-neutral-800 dark:text-neutral-200">
                      {evt.title}
                    </span>
                    {evt.meetLink && (
                      <Video className="w-2.5 h-2.5 text-indigo-500 shrink-0 ml-auto" />
                    )}
                  </motion.div>
                ))}

                {dayEvents.length > 3 && (
                  <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 pl-1">
                    +{dayEvents.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
