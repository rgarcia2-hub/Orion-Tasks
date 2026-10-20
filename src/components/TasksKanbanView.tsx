import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { AppTask, TaskStatus, TaskPriority } from '../types/calendar';
import { formatEventTimeRange } from '../utils/calendarData';
import { motion, AnimatePresence } from 'motion/react';
import {
  Kanban,
  List,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  MoreHorizontal,
  Trash2,
  Calendar as CalendarIcon,
  Filter,
  Zap,
  Cloud,
  RefreshCw,
  Plus,
  Check,
  GripVertical,
  FileText,
} from 'lucide-react';

export const TasksKanbanView: React.FC = () => {
  const {
    tasks,
    updateTaskStatus,
    deleteTask,
    setSelectedTaskForDetail,
    calendars,
    historicalCompletedCount,
    isTaskExpired,
    purgeExpiredTasks,
    user,
    isCloudSynced,
    googleToken,
    googleTaskLists,
    activeGoogleTaskListId,
    setActiveGoogleTaskListId,
    syncGoogleTasks,
    isSyncingGoogleTasks,
    createTaskInGoogleTasks,
    loginWithGoogle,
    getNotesForTask,
    setActiveTab,
  } = useCalendar();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [calendarFilter, setCalendarFilter] = useState<string>('all');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickNotes, setQuickNotes] = useState('');
  const [isCreatingQuick, setIsCreatingQuick] = useState(false);

  // Smooth Drag & Drop states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<TaskStatus | null>(null);

  const handleDropOnColumn = (targetCol: TaskStatus) => {
    if (draggedTaskId) {
      updateTaskStatus(draggedTaskId, targetCol);
    }
    setDraggedTaskId(null);
    setDragOverColId(null);
  };

  const filteredTasks = tasks.filter((task) => {
    // Si la fecha del evento ha vencido, se excluye del Kanban y de la Lista de tareas
    if (isTaskExpired && isTaskExpired(task)) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (calendarFilter !== 'all' && task.calendarId !== calendarFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchNotes = task.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }
    return true;
  });

  const columns: { id: TaskStatus; title: string; color: string; bgHeader: string }[] = [
    {
      id: 'pending',
      title: 'Pendiente',
      color: '#6B7280',
      bgHeader: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300',
    },
    {
      id: 'in_progress',
      title: 'En curso',
      color: '#3B82F6',
      bgHeader: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
    },
    {
      id: 'completed',
      title: 'Hecho',
      color: '#10B981',
      bgHeader: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto px-6 py-8 space-y-6"
    >
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e9e9e7] dark:border-[#2e2e2e]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Flujo de Eventos y Tareas
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Eventos duplicados desde tus calendarios para seguimiento de estado, notas y sub-tareas accionables.
          </p>
        </div>

        {/* View Switcher: Kanban vs List */}
        <div className="flex items-center gap-1 p-1 bg-[#f4f4f2] dark:bg-[#242424] rounded-lg self-start sm:self-center">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Tablero Kanban</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Vista de Lista</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#202020] p-3 rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Filtrar tareas duplicadas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-700 dark:text-neutral-300 rounded-lg border-0 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todas las prioridades</option>
            <option value="high">Prioridad Alta</option>
            <option value="medium">Prioridad Media</option>
            <option value="low">Prioridad Baja</option>
          </select>

          <select
            value={calendarFilter}
            onChange={(e) => setCalendarFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-700 dark:text-neutral-300 rounded-lg border-0 focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todos los orígenes</option>
            {calendars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Google Tasks & Cloud Sync Controls */}
      <div className="bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              GT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Google Tasks Integration
                </span>
                {isCloudSynced && user && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <Cloud className="w-3 h-3" />
                    <span>Guardado en {user.email?.split('@')[0]}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400">
                Sincroniza tus listas y tareas con tu cuenta de Google.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {googleToken ? (
              <>
                {googleTaskLists.length > 0 && (
                  <select
                    value={activeGoogleTaskListId || ''}
                    onChange={(e) => setActiveGoogleTaskListId(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-700 dark:text-neutral-300 rounded-lg border-0 focus:outline-hidden cursor-pointer"
                  >
                    {googleTaskLists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => syncGoogleTasks()}
                  disabled={isSyncingGoogleTasks}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#f4f4f2] dark:bg-[#2a2a2a] hover:bg-[#eaeae8] dark:hover:bg-[#333333] text-neutral-800 dark:text-neutral-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  title="Importar tareas desde Google Tasks a Orion"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingGoogleTasks ? 'animate-spin text-blue-500' : ''}`} />
                  <span>{isSyncingGoogleTasks ? 'Sincronizando...' : 'Sincronizar'}</span>
                </button>

                <button
                  onClick={() => setIsQuickCreateOpen((prev) => !prev)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva en Google Tasks</span>
                </button>
              </>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <span>Conectar con Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Create in Google Tasks Form */}
        {isQuickCreateOpen && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!quickTitle.trim()) return;
              setIsCreatingQuick(true);
              try {
                await createTaskInGoogleTasks(quickTitle.trim(), quickNotes.trim());
                setQuickTitle('');
                setQuickNotes('');
                setIsQuickCreateOpen(false);
              } catch (err) {
                console.error(err);
              } finally {
                setIsCreatingQuick(false);
              }
            }}
            className="pt-3 border-t border-[#f0f0ee] dark:border-[#2c2c2c] space-y-2 animate-in fade-in"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Título de la tarea en Google Tasks..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                required
                className="px-3 py-1.5 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-hidden"
              />
              <input
                type="text"
                placeholder="Notas o descripción (opcional)..."
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(false)}
                className="px-3 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreatingQuick || !quickTitle.trim()}
                className="px-3.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isCreatingQuick ? 'Guardando en Google...' : 'Guardar y Sincronizar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Regla de eventos vencidos: Banner informativo y estado de depuración */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#fafaf8] dark:bg-[#1f1f1f] border border-[#e9e9e7] dark:border-[#2e2e2e] text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span>
            <strong className="text-neutral-800 dark:text-neutral-200 font-medium">Gestión de vencimientos:</strong> Cuando la fecha de un evento ha vencido se elimina automáticamente de este Kanban y de la Lista de tareas, manteniéndose archivado en el calendario.
          </span>
        </div>
        <button
          onClick={() => {
            const count = purgeExpiredTasks();
            if (count === 0) {
              alert('Todo al día. No hay tareas vencidas en este momento.');
            }
          }}
          className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 underline underline-offset-2 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          Depurar vencidos
        </button>
      </div>

      {/* Helpful Tip about smooth drag-and-drop */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-50/70 via-purple-50/40 to-transparent dark:from-blue-950/30 dark:via-purple-950/20 dark:to-transparent border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-blue-500 shrink-0" />
          <span>
            <strong className="font-semibold text-blue-950 dark:text-blue-100">Arrastre fluido activo:</strong> Arrastra y suelta cualquier tarjeta libremente entre columnas para cambiar su estado. Animación suave sin necesidad de flechas.
          </span>
        </div>
        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 shrink-0 hidden sm:inline font-medium">
          ✨ Arrastrar y Soltar
        </span>
      </div>

      {/* KANBAN BOARD VIEW WITH MOTION DRAG & DROP ANIMATIONS */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {columns.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.id);
            const isColumnActive = dragOverColId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverColId !== col.id) setDragOverColId(col.id);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragOverColId(col.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    if (dragOverColId === col.id) setDragOverColId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnColumn(col.id);
                }}
                className={`rounded-2xl border p-3.5 space-y-3 transition-all duration-200 ${
                  isColumnActive
                    ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/30 shadow-md scale-[1.01]'
                    : 'bg-[#fcfcfb] dark:bg-[#1e1e1e] border-[#e9e9e7] dark:border-[#2e2e2e]'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    <h3 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      {col.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs tabular-nums text-neutral-400 dark:text-neutral-500 font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-[#272727] shadow-2xs">
                      {col.id === 'completed' ? historicalCompletedCount : columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Animated Drop Target Indicator */}
                <AnimatePresence>
                  {draggedTaskId && isColumnActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.96 }}
                      animate={{ opacity: 1, height: 50, scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="rounded-xl border-2 border-dashed border-blue-400 dark:border-blue-500 bg-blue-100/60 dark:bg-blue-900/40 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300 gap-2 shadow-inner"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      <span>Soltar aquí para pasar a {col.title}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Cards Container with motion layout */}
                <div className="space-y-2.5 min-h-[300px]">
                  <AnimatePresence mode="popLayout">
                    {columnTasks.map((task) => {
                      const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
                      const taskNotes = getNotesForTask ? getNotesForTask(task.id) : [];
                      const isDragging = draggedTaskId === task.id;

                      return (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{
                            opacity: isDragging ? 0.35 : 1,
                            y: 0,
                            scale: isDragging ? 0.97 : 1,
                          }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                          draggable={true}
                          onDragStart={(e: any) => {
                            if (e.dataTransfer) {
                              e.dataTransfer.setData('text/plain', task.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }
                            setDraggedTaskId(task.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverColId(null);
                          }}
                          onClick={() => setSelectedTaskForDetail(task)}
                          className={`bg-white dark:bg-[#262626] rounded-xl border p-3.5 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group select-none ${
                            isDragging
                              ? 'border-dashed border-blue-400 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-none'
                              : 'border-[#e9e9e7] dark:border-[#333333] hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5'
                          }`}
                        >
                          {/* Source Calendar, Drag Handle & Priority */}
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-medium truncate"
                              style={{ color: task.calendarColor }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: task.calendarColor }}
                              />
                              <span className="truncate">{task.calendarName}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                              {task.aiAnalysis && (
                                <span
                                  title="Análisis de IA disponible"
                                  className="inline-flex items-center text-purple-600 dark:text-purple-400"
                                >
                                  <Sparkles className="w-3 h-3" />
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  task.priority === 'high'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                    : task.priority === 'medium'
                                    ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                                    : 'bg-neutral-50 text-neutral-500 dark:bg-neutral-800/40 dark:text-neutral-400'
                                }`}
                              >
                                {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                              </span>
                              <GripVertical className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors shrink-0" />
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {task.title}
                          </h4>

                          {/* Date / Time */}
                          <div className="text-[11px] font-mono tabular-nums text-neutral-400 dark:text-neutral-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{formatEventTimeRange(task.startDateTime, task.endDateTime)}</span>
                          </div>

                          {/* Subtasks Progress */}
                          {task.subtasks.length > 0 && (
                            <div className="pt-1 space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono tabular-nums">
                                <span>Subtareas</span>
                                <span>
                                  {completedSubtasks}/{task.subtasks.length}
                                </span>
                              </div>
                              <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-neutral-900 dark:bg-neutral-300 rounded-full transition-all"
                                  style={{
                                    width: `${(completedSubtasks / task.subtasks.length) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Smooth Drag Footer & Linked Notes */}
                          <div className="pt-2 flex items-center justify-between border-t border-[#f0f0ee] dark:border-[#2f2f2f] text-[11px]">
                            <div className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              <GripVertical className="w-3 h-3 text-neutral-400" />
                              <span>Arrastrar</span>
                            </div>

                            {taskNotes.length > 0 ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveTab('notes');
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors cursor-pointer"
                                title="Ver notas vinculadas"
                              >
                                <FileText className="w-2.5 h-2.5" />
                                <span>{taskNotes.length} {taskNotes.length === 1 ? 'nota' : 'notas'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                {col.title}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {columnTasks.length === 0 && (
                    col.id === 'completed' ? (
                      <div className="py-8 px-4 text-center space-y-2 border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {historicalCompletedCount} duplicaciones finalizadas
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                          Arrastra tareas aquí para finalizarlas. Los eventos originales en tus calendarios permanecen intactos.
                        </p>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500 border border-dashed border-[#e0e0de] dark:border-[#2f2f2f] rounded-xl flex flex-col items-center justify-center gap-1.5">
                        <GripVertical className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                        <span>Columna vacía · Arrastra aquí</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] overflow-hidden shadow-xs"
        >
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9f9f8] dark:bg-[#252525] border-b border-[#e9e9e7] dark:border-[#2e2e2e] text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="py-2.5 px-4 font-medium w-10">Estado</th>
                <th className="py-2.5 px-4 font-medium">Evento / Tarea</th>
                <th className="py-2.5 px-4 font-medium">Calendario</th>
                <th className="py-2.5 px-4 font-medium">Horario</th>
                <th className="py-2.5 px-4 font-medium">Prioridad</th>
                <th className="py-2.5 px-4 font-medium text-right">Subtareas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0ee] dark:divide-[#2a2a2a]">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskForDetail(task)}
                    className="hover:bg-[#fafaf8] dark:hover:bg-[#262626] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTaskStatus(
                            task.id,
                            task.status === 'completed' ? 'pending' : 'completed'
                          );
                        }}
                        className="text-neutral-400 hover:text-emerald-500 transition-colors cursor-pointer"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </span>
                        {task.aiAnalysis && (
                          <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: task.calendarColor }}
                        />
                        <span>{task.calendarName}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                      {formatEventTimeRange(task.startDateTime, task.endDateTime)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                          task.priority === 'high'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : task.priority === 'medium'
                            ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            : 'bg-neutral-50 text-neutral-500 dark:bg-neutral-800/40 dark:text-neutral-400'
                        }`}
                      >
                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono tabular-nums text-right text-neutral-500">
                      {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No hay tareas en el flujo con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
};
