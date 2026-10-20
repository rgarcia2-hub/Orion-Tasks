import React, { useState } from 'react';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarEvent } from '../../types/calendar';
import { formatEventTimeRange, formatEventShortTime, isEventExpired } from '../../utils/calendarData';
import {
  Search,
  Video,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  Copy,
  CheckCircle2,
  Filter,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';

interface OrionCalendarAgendaViewProps {
  onOpenNewEvent: (datePrefill?: string) => void;
}

export const OrionCalendarAgendaView: React.FC<OrionCalendarAgendaViewProps> = ({
  onOpenNewEvent,
}) => {
  const {
    events,
    activeCalendarId,
    setSelectedEventForDetail,
    duplicateEventToApp,
    isClonedInApp,
  } = useCalendar();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'upcoming' | 'all' | 'past'>('upcoming');

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

  // Group events by date string
  const groupedEvents: { [dateStr: string]: CalendarEvent[] } = {};
  sortedEvents.forEach((evt) => {
    const dateStr = new Date(evt.startDateTime).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!groupedEvents[dateStr]) groupedEvents[dateStr] = [];
    groupedEvents[dateStr].push(evt);
  });

  const handleDuplicate = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    try {
      duplicateEventToApp(evt.id, 'medium', 'pending');
    } catch {
      // Handled via toast
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs p-6 space-y-6 flex-1">
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-[#f0f0ee] dark:border-[#2c2c2c]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar evento por título, notas o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-100 dark:bg-[#252525] border border-transparent focus:border-blue-500 rounded-xl focus:outline-hidden text-neutral-900 dark:text-neutral-100 transition-colors"
          />
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-[#252525] rounded-xl self-end sm:self-auto">
          {(['upcoming', 'all', 'past'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize cursor-pointer ${
                filterPeriod === period
                  ? 'bg-white dark:bg-[#1e1e1e] text-neutral-900 dark:text-neutral-100 shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {period === 'upcoming' ? 'Próximos' : period === 'all' ? 'Todos' : 'Pasados'}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grouped by Date */}
      <div className="space-y-6">
        {Object.keys(groupedEvents).length > 0 ? (
          Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
            <div key={dateLabel} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 capitalize">
                  {dateLabel}
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">
                  ({dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'})
                </span>
              </div>

              <div className="space-y-2">
                {dayEvents.map((evt) => (
                  <motion.div
                    key={evt.id}
                    onClick={() => setSelectedEventForDetail(evt)}
                    whileHover={{ x: 2 }}
                    className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-neutral-800/80 bg-neutral-50/40 dark:bg-[#242424] hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: evt.calendarColor,
                    }}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                          style={{ color: evt.calendarColor }}
                        >
                          {evt.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {evt.calendarName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
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
                        {evt.attendees?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-neutral-400" />
                            {evt.attendees.length} asistentes
                          </span>
                        )}
                      </div>

                      {evt.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                          {evt.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {evt.meetLink && (
                        <a
                          href={evt.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Meet</span>
                        </a>
                      )}

                      <button
                        onClick={(e) => handleDuplicate(e, evt)}
                        disabled={isClonedInApp(evt.id)}
                        title="Enviar a Orion Tasks Kanban"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                          isClonedInApp(evt.id)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-white dark:bg-[#282828] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {isClonedInApp(evt.id) ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>En Tasks</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>A Tasks</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-xs text-neutral-400 dark:text-neutral-500">
            <CalendarIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              No hay eventos encontrados
            </p>
            <p className="mt-1">Prueba cambiando los filtros o crea un nuevo evento.</p>
          </div>
        )}
      </div>
    </div>
  );
};
