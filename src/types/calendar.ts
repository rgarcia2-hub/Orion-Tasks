export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  organizer?: boolean;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  isPrimary?: boolean;
  selected?: boolean;
  timeZone?: string;
  isDefaultAutoDuplicate?: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  title: string;
  description: string;
  location?: string;
  meetLink?: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  attendees: CalendarAttendee[];
  organizerEmail?: string;
  htmlLink?: string;
  status?: string;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface AISummaryResult {
  summary: string;
  actionItems: string[];
  preparationNotes: string[];
  suggestedPriority?: TaskPriority;
  suggestedStatus?: TaskStatus;
}

export interface AppTask {
  id: string;
  sourceEventId?: string;
  calendarId: string;
  calendarName: string;
  calendarColor: string;
  title: string;
  description: string;
  location?: string;
  meetLink?: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  status: TaskStatus;
  priority: TaskPriority;
  notes: string;
  tags: string[];
  subtasks: Subtask[];
  aiAnalysis?: AISummaryResult;
  createdAt: string;
  completedAt?: string;
}
