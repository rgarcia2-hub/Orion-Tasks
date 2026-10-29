import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendar } from '../../context/CalendarContext';
import { AppTask, TaskPriority, TaskStatus, CalendarEvent } from '../../types/calendar';
import {
  X,
  Sparkles,
  Calendar as CalendarIcon,
  CheckCircle2,
  ListTodo,
  Plus,
  Trash2,
  AlertCircle,
  ArrowRight,
  Mail,
  Clock,
  MapPin,
  CalendarCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';

export interface EmailTaskData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  category?: string;
  subtasks: string[];
  emailSubject?: string;
  sender?: string;
  summary?: string;
  intent?: 'meeting' | 'action_required' | 'urgent' | 'info';
  suggestedEvent?: {
    title: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    location?: string;
  };
  smartReplies?: string[];
  keyDates?: string[];
}

interface EmailTaskPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: EmailTaskData | null;
}

export const EmailTaskPreviewModal: React.FC<EmailTaskPreviewModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const {
    createTaskDirectly,
    addEvent,
    events,
    calendars,
    defaultCalendarId,
    setCurrentApp,
    navigateToApp,
    setActiveTab,
  } = useCalendar();

  // Mode: Save as Task or Save as Calendar Event
  const [targetType, setTargetType] = useState<'task' | 'event'>('task');

  // Task form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || new Date().toISOString().split('T')[0]);
  const [subtasks, setSubtasks] = useState<string[]>(initialData?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Event form state
  const [eventDate, setEventDate] = useState(
    initialData?.suggestedEvent?.date || initialData?.dueDate || new Date().toISOString().split('T')[0]
  );
  const [eventStartTime, setEventStartTime] = useState(initialData?.suggestedEvent?.startTime || '10:00');
  const [eventDurationMinutes, setEventDurationMinutes] = useState(
    initialData?.suggestedEvent?.durationMinutes || 45
  );
  const [eventLocation, setEventLocation] = useState(
    initialData?.suggestedEvent?.location || 'Google Meet / Enlace virtual'
  );
  const [selectedCalendarId, setSelectedCalendarId] = useState(
    defaultCalendarId || calendars[0]?.id || 'default'
  );

  const [isSaved, setIsSaved] = useState(false);

  // Sync if initialData changes
  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setPriority(initialData.priority);
      const initialDate = initialData.dueDate || new Date().toISOString().split('T')[0];
      setDueDate(initialDate);
      setSubtasks(initialData.subtasks || []);

      if (initialData.suggestedEvent) {
        setTargetType('event');
        setEventDate(initialData.suggestedEvent.date || initialDate);
        setEventStartTime(initialData.suggestedEvent.startTime || '10:00');
        setEventDurationMinutes(initialData.suggestedEvent.durationMinutes || 45);
        if (initialData.suggestedEvent.location) {
          setEventLocation(initialData.suggestedEvent.location);
        }
      } else {
        setTargetType('task');
        setEventDate(initialDate);
      }

      setIsSaved(false);
    }
  }, [initialData]);

  // Conflict detection for Event Mode
  const conflictingEvent = useMemo(() => {
    if (targetType !== 'event' || !eventDate || !eventStartTime) return null;
    try {
      const [sh, sm] = eventStartTime.split(':').map((v) => parseInt(v, 10));
      const proposedStart = new Date(`${eventDate}T${String(sh).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')}:00`);
      const proposedEnd = new Date(proposedStart.getTime() + eventDurationMinutes * 60 * 1000);

      return (
        events.find((evt) => {
          if (evt.isAllDay) return false;
          try {
            const evtStart = new Date(evt.startDateTime);
            const evtEnd = new Date(evt.endDateTime);
            return proposedStart < evtEnd && proposedEnd > evtStart;
          } catch {
            return false;
          }
        }) || null
      );
    } catch {
      return null;
    }
  }, [targetType, eventDate, eventStartTime, eventDurationMinutes, events]);

  if (!isOpen || !initialData) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks((prev) => [...prev, newSubtaskText.trim()]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSubtask = (index: number, val: string) => {
    setSubtasks((prev) => prev.map((s, i) => (i === index ? val : s)));
  };

  const handleSaveAction = (navigateAfter: boolean = false) => {
    if (!title.trim()) return;

    const chosenCal =
      calendars.find((c) => c.id === selectedCalendarId) ||
      calendars.find((c) => c.id === defaultCalendarId) ||
      calendars[0] || {
        id: 'default',
        name: 'General',
        color: '#3B82F6',
      };

    if (targetType === 'task') {
      const startDateTime = `${dueDate}T09:00:00`;
      const endDateTime = `${dueDate}T10:00:00`;

      createTaskDirectly({
        calendarId: chosenCal.id,
        calendarName: chosenCal.name,
        calendarColor: chosenCal.color,
        title: title.trim(),
        description: description.trim(),
        location: '',
        startDateTime,
        endDateTime,
        isAllDay: true,
        status: 'pending',
        priority,
        notes: `Origen: Correo de ${initialData.sender || 'remitente'}\nAsunto: ${initialData.emailSubject || 'Sin asunto'}\n\n${description}`,
        tags: ['Email-to-Task', initialData.category || 'Correo'],
        subtasks: subtasks.map((st, i) => ({
          id: `st-${Date.now()}-${i}`,
          text: st,
          completed: false,
        })),
      });

      setIsSaved(true);
      setTimeout(() => {
        onClose();
        if (navigateAfter) {
          navigateToApp('tasks');
          setActiveTab('tasks');
        }
      }, 500);
    } else {
      // Save as Calendar Event
      const [sh, sm] = eventStartTime.split(':').map((v) => parseInt(v, 10));
      const startObj = new Date(
        `${eventDate}T${String(sh).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')}:00`
      );
      const endObj = new Date(startObj.getTime() + eventDurationMinutes * 60 * 1000);

      addEvent({
        calendarId: chosenCal.id,
        calendarName: chosenCal.name,
        calendarColor: chosenCal.color,
        title: title.trim(),
        description: `${description.trim()}\n\nOrigen: Correo de ${initialData.sender || 'contacto'}\nAsunto: "${initialData.emailSubject || ''}"`,
        location: eventLocation.trim(),
        startDateTime: startObj.toISOString(),
        endDateTime: endObj.toISOString(),
        isAllDay: false,
        attendees: initialData.sender
          ? [
              {
                email: initialData.sender.includes('@')
                  ? initialData.sender
                  : `${initialData.sender.toLowerCase().replace(/\s+/g, '.')}@email.com`,
                displayName: initialData.sender,
              },
            ]
          : [],
      });

      setIsSaved(true);
      setTimeout(() => {
        onClose();
        if (navigateAfter) {
          navigateToApp('calendar');
        }
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="w-full max-w-xl bg-white dark:bg-[#1a1a1e] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header with Warm AI Glow */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/40 dark:border-amber-400/30 flex items-center justify-center text-amber-500 dark:text-amber-300 shadow-[0_0_15px_rgba(254,240,138,0.45)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {targetType === 'task' ? 'Nueva Tarea desde Correo' : 'Agendar Evento desde Correo'}
                </h2>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/80 shadow-[0_0_10px_rgba(254,240,138,0.3)]">
                  IA Scan
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Información extraída y estructurada con inteligencia artificial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Target Type Selector: Task vs Event */}
          <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setTargetType('task')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                targetType === 'task'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 text-neutral-500" />
              <span>Guardar como Tarea</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('event')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                targetType === 'event'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-neutral-500" />
              <span>Agendar como Evento</span>
            </button>
          </div>

          {/* AI Executive Summary Card */}
          {initialData.summary && (
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[11px] text-amber-800 dark:text-amber-300">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Resumen Ejecutivo IA</span>
              </div>
              <p className="text-[11.5px]">{initialData.summary}</p>
            </div>
          )}

          {/* Email Reference Badge */}
          {initialData.emailSubject && (
            <div className="p-2.5 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
              <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <div className="min-w-0">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">Correo origen:</span>{' '}
                <span className="truncate text-neutral-500 dark:text-neutral-400">"{initialData.emailSubject}"</span>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              {targetType === 'task' ? 'Título de la tarea' : 'Título del evento'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Revisar propuesta técnica de diseño"
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
            />
          </div>

          {/* Conditional Form: Task Mode vs Event Mode */}
          {targetType === 'task' ? (
            <>
              {/* Priority & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Prioridad
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
                    {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
                      const isSelected = priority === p;
                      const labels = { low: 'Baja', medium: 'Media', high: 'Alta' };
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                          }`}
                        >
                          {labels[p]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                  />
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Subtareas extraídas ({subtasks.length})</span>
                  </span>
                </label>

                <div className="space-y-1.5 mb-2.5">
                  {subtasks.map((st, idx) => (
                    <div key={idx} className="flex items-center gap-2 group">
                      <div className="w-4 h-4 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-neutral-400">{idx + 1}</span>
                      </div>
                      <input
                        type="text"
                        value={st}
                        onChange={(e) => handleUpdateSubtask(idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200 outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                      />
                      <button
                        onClick={() => handleRemoveSubtask(idx)}
                        className="p-1 text-neutral-400 hover:text-rose-500 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Añadir subtarea..."
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-neutral-400 dark:focus:border-neutral-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-neutral-200 dark:border-neutral-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Event Scheduling Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Duración
                  </label>
                  <select
                    value={eventDurationMinutes}
                    onChange={(e) => setEventDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1 hora 30 min</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
              </div>

              {/* Location & Calendar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Ubicación / Enlace
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Google Meet, Sala de reuniones..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Calendario de destino
                  </label>
                  <select
                    value={selectedCalendarId}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs font-medium focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                  >
                    {calendars.map((cal) => (
                      <option key={cal.id} value={cal.id}>
                        {cal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Calendar Conflict Detector Banner */}
              {conflictingEvent ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-300/60 dark:border-amber-400/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-[0_0_15px_rgba(254,240,138,0.25)]">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      Coincidencia de horario detectada
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                      Ya tienes "{conflictingEvent.title}" programado en este rango horario. Puedes ajustar la hora o guardar de todas formas.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-300/40 dark:border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-[11px]">Horario despejado sin conflictos en tu calendario.</span>
                </div>
              )}
            </>
          )}

          {/* Description Context */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
              Descripción y contexto
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre lo que se debe hacer..."
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs leading-relaxed focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-md hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveAction(false)}
              disabled={isSaved || !title.trim()}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaved ? 'Guardado' : targetType === 'task' ? 'Guardar Tarea' : 'Guardar Evento'}
            </button>

            <button
              onClick={() => handleSaveAction(true)}
              disabled={isSaved || !title.trim()}
              className="px-3.5 py-1.5 text-xs font-medium rounded-md bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(254,240,138,0.3)]"
            >
              <span>{targetType === 'task' ? 'Guardar e ir a Tareas' : 'Guardar e ir a Calendario'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
