import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { TaskStatus, TaskPriority } from '../types/calendar';
import { formatEventTimeRange } from '../utils/calendarData';
import { motion } from 'motion/react';
import {
  X,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  Loader2,
  Clock,
  MapPin,
  Video,
  ExternalLink,
  Tag,
  ListTodo,
  FileText,
  Link2,
} from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const {
    selectedTaskForDetail,
    setSelectedTaskForDetail,
    updateTaskStatus,
    updateTask,
    deleteTask,
    finalizeAndRemoveTask,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    applyAISummary,
    getNotesForTask,
    addNote,
    setActiveTab,
  } = useCalendar();

  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!selectedTaskForDetail) return null;

  const task = selectedTaskForDetail;

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    addSubtask(task.id, newSubtaskText.trim());
    setNewSubtaskText('');
  };

  const handleRunAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.title,
          description: task.description || task.notes,
          location: task.location,
          startDateTime: task.startDateTime,
          endDateTime: task.endDateTime,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        applyAISummary(task.id, data.data);
      } else {
        setAiError(data.error || 'No se pudo generar el análisis');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Error al conectar con Gemini AI');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-[#e9e9e7] dark:border-[#333333] shadow-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0f0ee] dark:border-[#2a2a2a] sticky top-0 bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: task.calendarColor }}
            />
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {task.calendarName}
            </span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-xs font-mono tabular-nums text-neutral-400">
              Duplicado en la App
            </span>
          </div>

          <button
            onClick={() => setSelectedTaskForDetail(null)}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Title & Time */}
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {task.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{formatEventTimeRange(task.startDateTime, task.endDateTime)}</span>
            </div>
          </div>

          {/* Status & Priority Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#fafaf8] dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2f2f2f]">
            {/* Status Segmented Control */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Estado del Flujo
              </label>
              <div className="flex items-center gap-1 p-1 bg-[#f0f0ee] dark:bg-[#1c1c1c] rounded-lg">
                {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => updateTaskStatus(task.id, st)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      task.status === st
                        ? 'bg-white dark:bg-[#2c2c2c] text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                    }`}
                  >
                    {st === 'pending' ? 'Pendiente' : st === 'in_progress' ? 'En curso' : 'Hecho'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight">
                Al marcar como <strong>Hecho</strong>, la duplicación se elimina del flujo. El evento original se conserva en tu calendario.
              </p>
            </div>

            {/* Priority Control */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Prioridad
              </label>
              <div className="flex items-center gap-1 p-1 bg-[#f0f0ee] dark:bg-[#1c1c1c] rounded-lg">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((pr) => (
                  <button
                    key={pr}
                    onClick={() => updateTask(task.id, { priority: pr })}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      task.priority === pr
                        ? 'bg-white dark:bg-[#2c2c2c] text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                        : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                    }`}
                  >
                    {pr === 'high' ? 'Alta' : pr === 'medium' ? 'Media' : 'Baja'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Subtareas y Acciones ({task.subtasks.filter((s) => s.completed).length}/
                  {task.subtasks.length})
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {task.subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="group flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#fafafa] dark:bg-[#262626] border border-[#f0f0ee] dark:border-[#333333] hover:border-neutral-300 transition-colors"
                >
                  <button
                    onClick={() => toggleSubtask(task.id, sub.id)}
                    className="flex items-center gap-2.5 flex-1 text-left cursor-pointer"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        sub.completed
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {sub.text}
                    </span>
                  </button>

                  <button
                    onClick={() => deleteSubtask(task.id, sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add subtask form */}
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="+ Añadir nueva subtarea (presiona Enter)..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#262626] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!newSubtaskText.trim()}
                  className="px-3 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  Añadir
                </button>
              </form>
            </div>
          </div>

          {/* Gemini AI Assistant Section */}
          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Asistente Inteligente Gemini</span>
              </div>
              <button
                onClick={handleRunAI}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700/60 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sintetizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{task.aiAnalysis ? 'Actualizar Análisis IA' : 'Generar Resumen y Tareas con IA'}</span>
                  </>
                )}
              </button>
            </div>

            {task.aiAnalysis ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white/80 dark:bg-[#202020] rounded-lg border border-purple-100 dark:border-purple-900/40">
                  <span className="font-semibold text-purple-950 dark:text-purple-200">
                    Resumen Ejecutivo:
                  </span>
                  <p className="mt-1 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {task.aiAnalysis.summary}
                  </p>
                </div>

                {task.aiAnalysis.preparationNotes && task.aiAnalysis.preparationNotes.length > 0 && (
                  <div className="p-3 bg-white/80 dark:bg-[#202020] rounded-lg border border-purple-100 dark:border-purple-900/40">
                    <span className="font-semibold text-purple-950 dark:text-purple-200">
                      Puntos Clave y Preparación:
                    </span>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-neutral-700 dark:text-neutral-300">
                      {task.aiAnalysis.preparationNotes.map((note, idx) => (
                        <li key={idx}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-purple-800/80 dark:text-purple-300/80">
                Usa Gemini para analizar este evento, resumir su contexto y extraer automáticamente tareas de seguimiento a tu checklist.
              </p>
            )}

            {aiError && <p className="text-xs text-rose-600 dark:text-rose-400">{aiError}</p>}
          </div>

          {/* Linked Notes Section */}
          <div className="p-4 rounded-xl border border-[#e9e9e7] dark:border-[#2f2f2f] bg-[#fafaf8] dark:bg-[#252525] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <span>Notas vinculadas a esta tarea</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  addNote({
                    title: `Apuntes: ${task.title}`,
                    content: task.notes ? `Contexto de la tarea:\n${task.notes}\n\n` : '',
                    tags: ['Tarea', task.calendarName],
                    color: task.calendarColor || '#3B82F6',
                    linkedTaskId: task.id,
                  });
                  setSelectedTaskForDetail(null);
                  setActiveTab('notes');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#1f1f1f] border border-[#e5e5e3] dark:border-[#383838] rounded-lg hover:bg-neutral-100 dark:hover:bg-[#303030] transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Crear Nota Vinculada</span>
              </button>
            </div>

            {(() => {
              const taskNotes = getNotesForTask(task.id);
              if (taskNotes.length === 0) {
                return (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    No hay notas vinculadas aún. Puedes crear una nota con un clic para registrar minutas, actas y apuntes asociados directamente a esta tarea.
                  </p>
                );
              }

              return (
                <div className="space-y-1.5">
                  {taskNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-lg bg-white/90 dark:bg-[#222222] border border-[#e5e5e3] dark:border-[#333333] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {n.color && (
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: n.color }} />
                        )}
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono truncate hidden sm:inline">
                          {n.content ? n.content.substring(0, 45) + '...' : 'Nota vacía'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTaskForDetail(null);
                          setActiveTab('notes');
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
                      >
                        <span>Abrir nota</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Notes Textarea */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Notas y Detalles Internos
            </label>
            <textarea
              rows={4}
              value={task.notes || ''}
              onChange={(e) => updateTask(task.id, { notes: e.target.value })}
              placeholder="Escribe notas, minutas o reflexiones sobre esta reunión..."
              className="w-full p-3 text-xs bg-[#fafaf8] dark:bg-[#252525] text-neutral-900 dark:text-neutral-100 border border-[#e9e9e7] dark:border-[#2f2f2f] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-neutral-400 leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#f0f0ee] dark:border-[#2a2a2a] flex flex-wrap items-center justify-between gap-3 bg-[#fafaf8] dark:bg-[#1a1a1a] rounded-b-2xl">
          <button
            onClick={() => {
              deleteTask(task.id);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar del Flujo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => finalizeAndRemoveTask(task.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer"
              title="Marcar como finalizado y eliminar solo la duplicación (conserva el evento original)"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Finalizar y Eliminar Duplicación</span>
            </button>

            <button
              onClick={() => setSelectedTaskForDetail(null)}
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
