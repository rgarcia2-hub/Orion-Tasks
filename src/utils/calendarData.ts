import { Calendar, CalendarEvent, AppTask } from '../types/calendar';

// Start with completely clean default data as requested
export const INITIAL_CALENDARS: Calendar[] = [
  {
    id: 'cal-default',
    name: 'Mi Calendario',
    description: 'Calendario principal de eventos',
    color: '#3B82F6', // Blue
    isPrimary: true,
    selected: true,
  },
];

export const INITIAL_EVENTS: CalendarEvent[] = [];

export const INITIAL_TASKS: AppTask[] = [];

export const COLOR_PALETTE = [
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Púrpura', hex: '#8B5CF6' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Rojo', hex: '#EF4444' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Cian', hex: '#06B6D4' },
  { name: 'Índigo', hex: '#6366F1' },
  { name: 'Turquesa', hex: '#14B8A6' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Lima', hex: '#84CC16' },
  { name: 'Pizarra', hex: '#64748B' },
];

// Simple ICS (iCalendar) parser to allow importing real exported calendars
export function parseICSContent(icsText: string, calendarId: string, calendarName: string, calendarColor: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsText.replace(/\r\n/g, '\n').split('\n');
  
  let currentEvent: Partial<CalendarEvent> | null = null;
  let inVEvent = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      i++;
      line += lines[i].substring(1);
    }

    if (line.startsWith('BEGIN:VEVENT')) {
      inVEvent = true;
      currentEvent = {
        id: `ics-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        calendarId,
        calendarName,
        calendarColor,
        title: 'Sin título',
        description: '',
        attendees: [],
        isAllDay: false,
      };
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent && currentEvent.startDateTime) {
        if (!currentEvent.endDateTime) {
          currentEvent.endDateTime = currentEvent.startDateTime;
        }
        events.push(currentEvent as CalendarEvent);
      }
      inVEvent = false;
      currentEvent = null;
    } else if (inVEvent && currentEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8).trim().replace(/\\,/g, ',').replace(/\\n/g, '\n');
      } else if (line.startsWith('DESCRIPTION:')) {
        currentEvent.description = line.substring(12).trim().replace(/\\,/g, ',').replace(/\\n/g, '\n');
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9).trim().replace(/\\,/g, ',').replace(/\\n/g, '\n');
      } else if (line.startsWith('DTSTART')) {
        const isAllDay = line.includes('VALUE=DATE') || !line.includes('T');
        if (isAllDay) currentEvent.isAllDay = true;
        const value = line.split(':')[1];
        currentEvent.startDateTime = parseICSTimestamp(value, false);
      } else if (line.startsWith('DTEND')) {
        const isAllDay = line.includes('VALUE=DATE') || !line.includes('T');
        if (isAllDay) currentEvent.isAllDay = true;
        const value = line.split(':')[1];
        currentEvent.endDateTime = parseICSTimestamp(value, true);
      } else if (line.startsWith('ATTENDEE')) {
        const emailMatch = line.match(/mailto:([^;:]+)/i);
        const nameMatch = line.match(/CN=([^;:]+)/i);
        if (emailMatch) {
          currentEvent.attendees = currentEvent.attendees || [];
          currentEvent.attendees.push({
            email: emailMatch[1].trim(),
            displayName: nameMatch ? nameMatch[1].replace(/"/g, '').trim() : emailMatch[1].trim(),
            responseStatus: 'accepted',
          });
        }
      }
    }
  }

  return events;
}

function parseICSTimestamp(dtStr: string, isEnd = false): string {
  if (!dtStr) return new Date().toISOString();
  const cleaned = dtStr.trim();
  if (cleaned.length === 8) {
    const year = parseInt(cleaned.substring(0, 4), 10);
    const month = parseInt(cleaned.substring(4, 6), 10) - 1;
    const day = parseInt(cleaned.substring(6, 8), 10);
    return new Date(Date.UTC(year, month, day, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0)).toISOString();
  }
  const match = cleaned.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (match) {
    const [, y, m, d, hh, mm, ss] = match;
    const date = new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), parseInt(hh, 10), parseInt(mm, 10), parseInt(ss, 10)));
    return date.toISOString();
  }
  return new Date().toISOString();
}

/**
 * Determines if an event is an all-day or whole-day spanning event.
 */
export function isAllDayEvent(evt: CalendarEvent): boolean {
  if (evt.isAllDay) return true;
  try {
    const start = new Date(evt.startDateTime);
    const end = new Date(evt.endDateTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    // Spans 18 hours or more
    if (durationHours >= 18) return true;
    // Spans whole calendar day
    if (start.getHours() === 0 && start.getMinutes() === 0 && (end.getHours() === 23 || end.getHours() === 0)) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

// Formatting helpers
export function formatEventTimeRange(startIso: string, endIso: string): string {
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

    const sameDay = start.toDateString() === end.toDateString();
    const formattedDate = start.toLocaleDateString('es-ES', dateOptions);
    const startTime = start.toLocaleTimeString('es-ES', timeOptions);
    const endTime = end.toLocaleTimeString('es-ES', timeOptions);

    if (sameDay) {
      return `${formattedDate} · ${startTime} - ${endTime}`;
    }
    return `${start.toLocaleDateString('es-ES', dateOptions)} ${startTime} - ${end.toLocaleDateString('es-ES', dateOptions)} ${endTime}`;
  } catch {
    return 'Fecha pendiente';
  }
}

export function formatEventShortTime(startIso: string): string {
  try {
    const start = new Date(startIso);
    return start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function getCountdownString(targetIso: string): { text: string; isPast: boolean; isImminent: boolean } {
  try {
    const target = new Date(targetIso).getTime();
    const now = Date.now();
    const diffMs = target - now;

    if (diffMs < 0) {
      const minutesAgo = Math.floor(Math.abs(diffMs) / (1000 * 60));
      if (minutesAgo < 60) return { text: `Comenzó hace ${minutesAgo} min`, isPast: true, isImminent: false };
      const hoursAgo = Math.floor(minutesAgo / 60);
      return { text: `Finalizado hace ${hoursAgo}h`, isPast: true, isImminent: false };
    }

    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 15) {
      return { text: `En ${minutes} minutos`, isPast: false, isImminent: true };
    }
    if (minutes < 60) {
      return { text: `En ${minutes} min`, isPast: false, isImminent: true };
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return { text: `En ${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`, isPast: false, isImminent: hours <= 2 };
    }
    const days = Math.floor(hours / 24);
    return { text: `En ${days} día${days > 1 ? 's' : ''}`, isPast: false, isImminent: false };
  } catch {
    return { text: 'Próximamente', isPast: false, isImminent: false };
  }
}

// Calendar Month Grid Generator
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateKey: string; // YYYY-MM-DD
}

export function getMonthMatrix(year: number, month: number): CalendarDay[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Day of week: 0 (Sun) to 6 (Sat). We want Monday (0) to Sunday (6)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday is 6

  const days: CalendarDay[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  // Previous month padding days
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDate - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: dateKey === todayStr,
      dateKey,
    });
  }

  // Current month days
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const d = new Date(year, month, day);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      date: d,
      isCurrentMonth: true,
      isToday: dateKey === todayStr,
      dateKey,
    });
  }

  // Next month padding days to reach multiple of 7 (up to 35 or 42 cells)
  const remainingCells = (7 - (days.length % 7)) % 7;
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(year, month + 1, day);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      date: d,
      isCurrentMonth: false,
      isToday: dateKey === todayStr,
      dateKey,
    });
  }

  return days;
}

export function isEventOnDate(evt: CalendarEvent, dateKey: string): boolean {
  try {
    const evtStartKey = new Date(evt.startDateTime).toISOString().slice(0, 10);
    return evtStartKey === dateKey;
  } catch {
    return false;
  }
}

/**
 * Determines whether an event or task date has expired / passed (ha vencido).
 * Prioritizes endDateTime; if not present, falls back to startDateTime.
 * For all-day events, it expires at the end of that day (23:59:59.999).
 */
export function isEventExpired(
  endDateTime?: string,
  startDateTime?: string,
  isAllDay?: boolean
): boolean {
  const targetStr = endDateTime || startDateTime;
  if (!targetStr) return false;

  const date = new Date(targetStr);
  if (isNaN(date.getTime())) return false;

  const now = new Date();

  if (isAllDay) {
    const endOfDay = new Date(date);
    if (endOfDay.getHours() === 0 && endOfDay.getMinutes() === 0 && endOfDay.getSeconds() === 0) {
      endOfDay.setHours(23, 59, 59, 999);
    }
    return endOfDay.getTime() < now.getTime();
  }

  return date.getTime() < now.getTime();
}

/**
 * Returns the 7 days of the week (Monday through Sunday) containing the given date.
 */
export function getWeekDays(referenceDate: Date): Date[] {
  const date = new Date(referenceDate);
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday...
  // Convert so Monday is 0 and Sunday is 6
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export function isSameDay(d1: Date | string, d2: Date | string): boolean {
  try {
    const date1 = typeof d1 === 'string' ? new Date(d1) : d1;
    const date2 = typeof d2 === 'string' ? new Date(d2) : d2;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  } catch {
    return false;
  }
}

export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


