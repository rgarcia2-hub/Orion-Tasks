import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEvent } from '../types/calendar';
import { getMonthMatrix, formatEventShortTime, isEventOnDate } from '../utils/calendarData';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  CheckCircle2,
} from 'lucide-react';

interface VisualCalendarGridProps {
  onOpenNewEventForDate: (dateIso: string) => void;
}

export const VisualCalendarGrid: React.FC<VisualCalendarGridProps> = ({
  onOpenNewEventForDate,
}) => {
  const {
    events,
    activeCalendarId,
    setSelectedEventForDetail,
    isClonedInApp,
  } = useCalendar();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [direction, setDirection] = useState<number>(0);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const calendarEvents = events.filter((evt) => {
    if (activeCalendarId !== 'all' && evt.calendarId !== activeCalendarId) {
      return false;
    }
    return true;
  });

  const daysMatrix = getMonthMatrix(year, month);

  const handlePrevMonth = () => {
    setDirection(-1);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDirection(1);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setDirection(0);
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-white dark:bg-[#202020] rounded-2xl border border-[#e9e9e7] dark:border-[#2e2e2e] overflow-hidden shadow-xs space-y-0">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
        <div className="flex items-center gap-3">
          <motion.h2
            key={`${year}-${month}`}
            initial={{ opacity: 0, x: direction * 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-bold text-neutral-900 dark:text-neutral-100 capitalize"
          >
            {monthNames[month]} {year}
          </motion.h2>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-[#e0e0de] dark:border-[#333333] rounded-md hover:bg-neutral-50 dark:hover:bg-[#262626] transition-colors cursor-pointer"
          >
            Hoy
          </button>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#262626] transition-colors cursor-pointer"
            title="Siguiente mes"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#fafaf8] dark:bg-[#1a1a1a] text-center text-xs font-semibold text-neutral-400 dark:text-neutral-500 py-2">
        {weekDays.map((w, idx) => (
          <div key={idx} className={idx >= 5 ? 'text-neutral-300 dark:text-neutral-600' : ''}>
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-7 divide-x divide-y divide-[#f0f0ee] dark:divide-[#282828] bg-white dark:bg-[#1f1f1f]"
        >
          {daysMatrix.map((day) => {
            const dayEvents = calendarEvents.filter((e) => isEventOnDate(e, day.dateKey));

            return (
              <div
                key={day.dateKey}
                onClick={() => onOpenNewEventForDate(`${day.dateKey}T09:00`)}
                className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 transition-colors cursor-pointer group flex flex-col justify-between ${
                  !day.isCurrentMonth
                    ? 'bg-[#fcfcfb]/60 dark:bg-[#1a1a1a]/40 text-neutral-300 dark:text-neutral-600'
                    : 'hover:bg-[#fbfbf9] dark:hover:bg-[#252525]'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center font-mono text-xs tabular-nums w-6 h-6 rounded-full transition-colors ${
                      day.isToday
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold'
                        : day.isCurrentMonth
                        ? 'text-neutral-700 dark:text-neutral-300 font-medium'
                        : 'text-neutral-400/60 dark:text-neutral-600'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNewEventForDate(`${day.dateKey}T09:00`);
                    }}
                    title="Añadir evento en este día"
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Day Events Stack */}
                <div className="space-y-1 flex-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map((evt) => {
                    const cloned = isClonedInApp(evt.id);

                    return (
                      <motion.div
                        key={evt.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForDetail(evt);
                        }}
                        className="px-1.5 py-1 rounded text-[11px] font-medium leading-tight truncate transition-colors cursor-pointer flex items-center gap-1 shadow-2xs border"
                        style={{
                          backgroundColor: `${evt.calendarColor}18`,
                          borderColor: `${evt.calendarColor}40`,
                          color: evt.calendarColor,
                        }}
                        title={`${evt.title} (${evt.calendarName})`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: evt.calendarColor }}
                        />
                        <span className="font-mono text-[10px] tabular-nums shrink-0 opacity-80">
                          {formatEventShortTime(evt.startDateTime)}
                        </span>
                        <span className="truncate flex-1 text-neutral-800 dark:text-neutral-200">
                          {evt.title}
                        </span>
                        {evt.meetLink && <Video className="w-2.5 h-2.5 shrink-0 opacity-70" />}
                        {cloned && <CheckCircle2 className="w-2.5 h-2.5 shrink-0 text-emerald-500" />}
                      </motion.div>
                    );
                  })}

                  {dayEvents.length > 3 && (
                    <div className="text-[10px] font-mono text-neutral-400 px-1 pt-0.5">
                      +{dayEvents.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
