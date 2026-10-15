import React, { useState, useEffect } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { X, Calendar as CalendarIcon, Clock, MapPin, Video, Users } from 'lucide-react';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillDate?: string | null;
}

export const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, prefillDate }) => {
  const { calendars, addEvent } = useCalendar();

  const getInitialStart = () => {
    if (prefillDate) return prefillDate.slice(0, 16);
    return new Date(Date.now() + 3600000).toISOString().slice(0, 16);
  };

  const getInitialEnd = () => {
    if (prefillDate) {
      const d = new Date(prefillDate);
      d.setHours(d.getHours() + 1);
      return d.toISOString().slice(0, 16);
    }
    return new Date(Date.now() + 7200000).toISOString().slice(0, 16);
  };

  const [title, setTitle] = useState('');
  const [calendarId, setCalendarId] = useState(calendars[0]?.id || '');
  const [startDateTime, setStartDateTime] = useState(getInitialStart);
  const [endDateTime, setEndDateTime] = useState(getInitialEnd);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [attendeesInput, setAttendeesInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStartDateTime(getInitialStart());
      setEndDateTime(getInitialEnd());
      if (calendars.length > 0 && !calendarId) {
        setCalendarId(calendars[0].id);
      }
    }
  }, [isOpen, prefillDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const chosenCal = calendars.find((c) => c.id === calendarId) || calendars[0] || {
      id: 'cal-default',
      name: 'Mi Calendario',
      color: '#3B82F6',
    };

    const attendeesList = attendeesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((email) => ({
        email,
        displayName: email.split('@')[0],
        responseStatus: 'needsAction' as const,
      }));

    addEvent({
      calendarId: chosenCal.id,
      calendarName: chosenCal.name,
      calendarColor: chosenCal.color,
      title: title.trim(),
      description: description.trim(),
      startDateTime: new Date(startDateTime).toISOString(),
      endDateTime: new Date(endDateTime).toISOString(),
      isAllDay: false,
      location: location.trim() || undefined,
      meetLink: meetLink.trim() || undefined,
      attendees: attendeesList,
    });

    onClose();
    setTitle('');
    setDescription('');
    setLocation('');
    setMeetLink('');
    setAttendeesInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-[#e9e9e7] dark:border-[#333333] shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0f0ee] dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Crear Nuevo Evento
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Título del Evento *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Reunión con clientes, Lanzamiento, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Calendario Destino
            </label>
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-hidden cursor-pointer"
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Inicio
              </label>
              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Fin
              </label>
              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Descripción / Notas
            </label>
            <textarea
              rows={3}
              placeholder="Objetivos de la reunión, temas a tratar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                placeholder="Sala 3 / Remoto"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Enlace Google Meet
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Asistentes (emails separados por coma)
            </label>
            <input
              type="text"
              placeholder="ana@empresa.com, carlos@empresa.com"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#f0f0ee] dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
            >
              Crear Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
