import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthMatrix, formatDateKey, isSameDay } from '../../utils/calendarData';

interface OrionCalendarMiniMonthProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const OrionCalendarMiniMonth: React.FC<OrionCalendarMiniMonthProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [viewDate, setViewDate] = useState(() => new Date(selectedDate));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const weekHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const daysMatrix = getMonthMatrix(year, month);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="p-3 bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2c2c2c] select-none text-xs">
      {/* Month Header and Mini Controls */}
      <div className="flex items-center justify-between mb-2.5 px-1">
        <span className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
          {monthNames[month]} {year}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handlePrevMonth}
            className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            title="Mes anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
            title="Siguiente mes"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Week Day Letters */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-neutral-400 dark:text-neutral-500 mb-1">
        {weekHeaders.map((letter, idx) => (
          <div key={idx} className="h-5 flex items-center justify-center">
            {letter}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
        {daysMatrix.map((item, idx) => {
          const isSelected = isSameDay(item.date, selectedDate);
          const isToday = item.isToday;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(item.date)}
              className={`h-6.5 w-6.5 mx-auto flex items-center justify-center rounded-md font-mono tabular-nums transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : isToday
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold ring-1 ring-blue-500/40'
                  : item.isCurrentMonth
                  ? 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a]'
                  : 'text-neutral-300 dark:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-[#262626]'
              }`}
            >
              {item.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
