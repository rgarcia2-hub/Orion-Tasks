import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { CalendarEvent } from '../types/calendar';
import { formatEventTimeRange, getCountdownString } from '../utils/calendarData';
import { GoogleAuthButton } from './GoogleAuthButton';
import {
  Clock,
  Video,
  MapPin,
  Users,
  Copy,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  TrendingUp,
  ListTodo,
  Calendar as CalendarIcon,
  Plus,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    nextUpcomingEvent,
    stats,
    tasks,
    updateTaskStatus,
    duplicateEventToApp,
    isClonedInApp,
    setSelectedEventForDetail,
    setSelectedTaskForDetail,
    setActiveTab,
    isGoogleConnected,
    isTaskExpired,
  } = useCalendar();

  const countdown = nextUpcomingEvent
    ? getCountdownString(nextUpcomingEvent.startDateTime)
    : null;

  const pendingTasks = tasks.filter((t) => t.status === 'pending' && (!isTaskExpired || !isTaskExpired(t)));

  const handleDuplicate = (e: React.MouseEvent, evt: CalendarEvent) => {
    e.stopPropagation();
    try {
      duplicateEventToApp(evt.id, 'medium', 'pending');
    } catch {
      // Handled via toast in CalendarContext
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-6 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Panel de Inicio
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Resumen diario de tus calendarios sincronizados, flujo de trabajo y métricas de cumplimiento.
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-neutral-400 dark:text-neutral-500">
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Grid: Próximo Evento (7 cols) + Estadísticas de Completados (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Upcoming Event */}
        <div className="lg:col-span-7 bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                  Próximo Evento
                </span>
              </div>
              {countdown && (
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium font-mono tabular-nums ${
                    countdown.isImminent
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{countdown.text}</span>
                </div>
              )}
            </div>

            {nextUpcomingEvent ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                    {nextUpcomingEvent.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium"
                      style={{
                        backgroundColor: `${nextUpcomingEvent.calendarColor}15`,
                        color: nextUpcomingEvent.calendarColor,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: nextUpcomingEvent.calendarColor }}
                      />
                      {nextUpcomingEvent.calendarName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatEventTimeRange(nextUpcomingEvent.startDateTime, nextUpcomingEvent.endDateTime)}
                    </span>
                  </div>
                </div>

                {nextUpcomingEvent.description && (
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                    {nextUpcomingEvent.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {nextUpcomingEvent.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[220px]">{nextUpcomingEvent.location}</span>
                    </div>
                  )}
                  {nextUpcomingEvent.attendees && nextUpcomingEvent.attendees.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>{nextUpcomingEvent.attendees.length} asistentes</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <CalendarIcon className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  No hay eventos próximos en tu agenda
                </p>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  {isGoogleConnected
                    ? 'Tus eventos aparecerán aquí automáticamente conforme se programen.'
                    : 'Conecta tu Google Calendar o crea un evento para comenzar.'}
                </p>
                {!isGoogleConnected && (
                  <div className="pt-2 flex items-center justify-center">
                    <GoogleAuthButton compact />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          {nextUpcomingEvent && (
            <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-[#f0f0ee] dark:border-[#2a2a2a]">
              <button
                onClick={() => setSelectedEventForDetail(nextUpcomingEvent)}
                className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Inspeccionar detalles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                {nextUpcomingEvent.meetLink && (
                  <a
                    href={nextUpcomingEvent.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Unirse a Meet</span>
                  </a>
                )}

                {isClonedInApp(nextUpcomingEvent.id) ? (
                  <button
                    onClick={() => setActiveTab('tasks')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>En el Flujo de la App</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleDuplicate(e, nextUpcomingEvent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicar a la App</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Completion Statistics */}
        <div className="lg:col-span-5 bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400">
                  Estadísticas de Cumplimiento
                </span>
              </div>
              <span className="text-xs font-mono tabular-nums text-neutral-400">
                {stats.completed} de {stats.total} completados
              </span>
            </div>

            {/* Circular Progress */}
            <div className="flex items-center gap-5 my-3">
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-neutral-100 dark:text-neutral-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-700 ease-out"
                    strokeDasharray={`${stats.completionRate}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-lg font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                    {stats.completionRate}%
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 dark:text-neutral-400">Tasa de resolución</span>
                  <span className="font-mono tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                    {stats.completionRate}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 leading-tight">
                  {stats.total === 0
                    ? 'Duplica eventos a la app para medir tu progreso.'
                    : stats.completionRate >= 70
                    ? 'Excelente ritmo de avance esta semana.'
                    : 'Hay tareas importantes pendientes en tu flujo.'}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-[#f0f0ee] dark:border-[#2a2a2a] text-center">
              <div className="p-2.5 rounded-lg bg-[#fafafa] dark:bg-[#1a1a1a]">
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400">Pendientes</div>
                <div className="text-lg font-bold font-mono tabular-nums text-neutral-800 dark:text-neutral-200">
                  {stats.pending}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#fafafa] dark:bg-[#1a1a1a]">
                <div className="text-[11px] text-blue-600 dark:text-blue-400">En curso</div>
                <div className="text-lg font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
                  {stats.inProgress}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#fafafa] dark:bg-[#1a1a1a]">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Hecho</div>
                <div className="text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {stats.completed}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#f0f0ee] dark:border-[#2a2a2a]">
            <button
              onClick={() => setActiveTab('tasks')}
              className="w-full py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Ir al Tablero Kanban</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Tareas Pendientes */}
      <div className="bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Tareas Pendientes en el Flujo
            </h2>
            <span className="font-mono text-xs tabular-nums text-neutral-400 dark:text-neutral-500">
              ({pendingTasks.length})
            </span>
          </div>

          <button
            onClick={() => setActiveTab('calendars')}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Explorar calendarios para duplicar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {pendingTasks.length > 0 ? (
          <div className="divide-y divide-[#f0f0ee] dark:divide-[#2a2a2a]">
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskForDetail(task)}
                className="group py-3.5 flex items-center justify-between gap-4 hover:bg-[#fafaf8] dark:hover:bg-[#252525] px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskStatus(task.id, 'completed');
                    }}
                    title="Finalizar tarea y eliminar duplicación (el evento original permanece intacto en tu calendario)"
                    className="text-neutral-400 hover:text-emerald-500 dark:text-neutral-500 dark:hover:text-emerald-400 transition-colors shrink-0 cursor-pointer"
                  >
                    <Circle className="w-4 h-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {task.title}
                      </span>
                      {task.priority === 'high' && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                          Alta
                        </span>
                      )}
                      {task.aiAnalysis && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 dark:text-purple-400">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>IA</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: task.calendarColor }}
                        />
                        {task.calendarName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatEventTimeRange(task.startDateTime, task.endDateTime)}
                      </span>
                      {task.subtasks.length > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtareas
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateTaskStatus(task.id, 'in_progress');
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                  >
                    Mover a En curso
                  </button>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                No tienes tareas pendientes
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Ve a la pestaña de Calendarios para explorar tus eventos reales y duplicar los que quieras gestionar.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('calendars')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Ir a Calendarios</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
