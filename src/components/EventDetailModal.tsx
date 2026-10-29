import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { formatEventTimeRange, getCountdownString, isEventExpired } from '../utils/calendarData';
import { TaskStatus, TaskPriority, AISummaryResult } from '../types/calendar';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  Users,
  Copy,
  CheckCircle2,
  Sparkles,
  Trash2,
  ExternalLink,
  Loader2,
  FileText,
} from 'lucide-react';

export const EventDetailModal: React.FC = () => {
  const {
    selectedEventForDetail,
    setSelectedEventForDetail,
    duplicateEventToApp,
    isClonedInApp,
    deleteEvent,
    setActiveTab,
    addNote,
    linkNoteToEvent,
    setSelectedNoteId,
    setCurrentApp,
  } = useCalendar();

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISummaryResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!selectedEventForDetail) return null;

  const event = selectedEventForDetail;
  const isExpired = isEventExpired(event.endDateTime, event.startDateTime, event.isAllDay);
  const isCloned = !isExpired && isClonedInApp(event.id);
  const countdown = getCountdownString(event.startDateTime);

  const handleDuplicate = (status: TaskStatus = 'pending', priority: TaskPriority = 'medium') => {
    const newTask = duplicateEventToApp(event.id, priority, status);
    setSelectedEventForDetail(null);
    setActiveTab('tasks');
  };

  const handleCreateMeetingNote = () => {
    const attendeesList = event.attendees && event.attendees.length > 0
      ? event.attendees.map((a: any) => typeof a === 'string' ? a : a.displayName || a.email).join(', ')
      : 'No especificados';

    const formattedDate = new Date(event.startDateTime).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const initialContent = `# Minuta: ${event.title}
**Fecha:** ${formattedDate}
**Ubicación/Enlace:** ${event.location || event.meetLink || 'Virtual'}
**Participantes:** ${attendeesList}

---
### 📌 Puntos Clave & Agenda
- [ ] Revisar avances del periodo
- [ ] Analizar bloqueos y soluciones propuestas
- [ ] Definir responsables de los entregables

### 📝 Notas de la Reunión
(Escribe aquí los apuntes y decisiones tomadas durante la sesión...)

### 🎯 Acuerdos y Próximos Pasos
- [ ] Concretar próximos hitos
`;

    const newNote = addNote({
      title: `Minuta: ${event.title}`,
      content: initialContent,
      tags: ['Reunión', 'Minuta'],
      color: event.calendarColor || '#3B82F6',
      isPinned: false,
      linkedEventId: event.id,
    });

    linkNoteToEvent(newNote.id, event.id);
    setSelectedNoteId(newNote.id);
    setSelectedEventForDetail(null);
    setCurrentApp('tasks');
    setActiveTab('notes');
  };

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          location: event.location,
          attendees: event.attendees,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAiResult(data.data);
      } else {
        setAiError(data.error || 'No se pudo generar el análisis');
      }
    } catch (err: any) {
      setAiError(err?.message || 'Error al conectar con el asistente de IA');
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
        className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-[#e9e9e7] dark:border-[#333333] shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0f0ee] dark:border-[#2a2a2a] sticky top-0 bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: event.calendarColor }}
            />
            <span className="font-medium text-neutral-600 dark:text-neutral-400">
              {event.calendarName}
            </span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="font-mono tabular-nums text-neutral-500">
              {countdown.text}
            </span>
          </div>

          <button
            onClick={() => setSelectedEventForDetail(null)}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
              {event.title}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mt-2 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{formatEventTimeRange(event.startDateTime, event.endDateTime)}</span>
            </div>
          </div>

          {/* Quick links: Location & Meet */}
          {(event.location || event.meetLink) && (
            <div className="p-3 rounded-xl bg-[#fafaf8] dark:bg-[#262626] border border-[#e9e9e7] dark:border-[#333333] text-xs space-y-2">
              {event.location && (
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.meetLink && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#f0f0ee] dark:border-[#333333]">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                    <Video className="w-3.5 h-3.5" />
                    <span className="truncate">{event.meetLink}</span>
                  </div>
                  <a
                    href={event.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 rounded hover:bg-blue-100 transition-colors"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Descripción del Evento
              </h4>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed bg-[#fafafa] dark:bg-[#252525] p-3.5 rounded-xl border border-[#f0f0ee] dark:border-[#2f2f2f]">
                {event.description}
              </p>
            </div>
          )}

          {/* Attendees */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Asistentes ({event.attendees.length})
              </h4>
              <div className="divide-y divide-[#f0f0ee] dark:divide-[#2a2a2a] max-h-36 overflow-y-auto">
                {event.attendees.map((attendee, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center font-bold text-[10px] text-neutral-700 dark:text-neutral-300 shrink-0">
                        {(attendee.displayName || attendee.email)[0].toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {attendee.displayName || attendee.email}
                        </div>
                        {attendee.displayName && (
                          <div className="text-[10px] text-neutral-400 truncate">
                            {attendee.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 shrink-0">
                      {attendee.responseStatus === 'accepted'
                        ? 'Aceptado'
                        : attendee.responseStatus === 'declined'
                        ? 'Rechazado'
                        : 'Pendiente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gemini AI Quick Summary Assistant */}
          <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Asistente Inteligente Gemini</span>
              </div>
              <button
                onClick={handleGenerateAI}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-purple-900/60 border border-purple-200 dark:border-purple-700/60 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiResult ? 'Re-analizar' : 'Resumir y Extraer Tareas'}</span>
                  </>
                )}
              </button>
            </div>

            {aiResult && (
              <div className="space-y-2.5 text-xs animate-in fade-in">
                <div className="text-neutral-800 dark:text-neutral-200 leading-relaxed">
                  <strong>Resumen:</strong> {aiResult.summary}
                </div>
                {aiResult.actionItems && aiResult.actionItems.length > 0 && (
                  <div>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Tareas de acción extraídas:
                    </span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-neutral-600 dark:text-neutral-400">
                      {aiResult.actionItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {aiError && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{aiError}</p>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-[#f0f0ee] dark:border-[#2a2a2a] flex items-center justify-between gap-3 bg-[#fafaf8] dark:bg-[#1a1a1a] rounded-b-2xl">
          <button
            onClick={() => {
              if (window.confirm('¿Seguro que deseas eliminar este evento de la vista?')) {
                deleteEvent(event.id);
              }
            }}
            className="p-2 text-neutral-400 hover:text-rose-600 transition-colors rounded-lg cursor-pointer"
            title="Eliminar evento"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateMeetingNote}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              title="Crear minuta de reunión estructurada en Orion Notes"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Crear minuta</span>
            </button>

            {isExpired ? (
              <div className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Evento vencido (conservado en calendario)</span>
              </div>
            ) : isCloned ? (
              <button
                onClick={() => {
                  setSelectedEventForDetail(null);
                  setActiveTab('tasks');
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ver en Flujo de Tareas</span>
              </button>
            ) : (
              <button
                onClick={() => handleDuplicate('pending')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar en la App</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
