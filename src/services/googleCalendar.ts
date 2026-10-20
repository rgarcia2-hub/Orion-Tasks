import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import { Calendar, CalendarEvent } from '../types/calendar';

export { auth };

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

const TOKEN_STORAGE_KEY = 'orion_google_access_token_v3';

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
})();

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken) {
        try {
          cachedAccessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        } catch {
          cachedAccessToken = null;
        }
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Calendar.');
    }

    cachedAccessToken = credential.accessToken;
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, credential.accessToken);
    } catch (e) {
      console.error(e);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error durante el inicio de sesión con Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      cachedAccessToken = null;
    }
  }
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
};

// Fetch real Google Calendars from Google Calendar API
export async function fetchGoogleCalendars(accessToken: string): Promise<Calendar[]> {
  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error al obtener calendarios: ${res.statusText}`);
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((item: any) => ({
    id: item.id,
    name: item.summaryOverride || item.summary || 'Calendario sin nombre',
    description: item.description || '',
    color: item.backgroundColor || '#3B82F6',
    isPrimary: Boolean(item.primary),
    selected: Boolean(item.selected),
    timeZone: item.timeZone,
  }));
}

// Fetch real events for a specific calendar
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  calendarId: string,
  calendarName: string,
  calendarColor: string
): Promise<CalendarEvent[]> {
  // Fetch from 15 days ago to 90 days in the future
  const timeMin = new Date(Date.now() - 15 * 86400000).toISOString();
  const timeMax = new Date(Date.now() + 90 * 86400000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId
  )}/events?maxResults=100&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
    timeMin
  )}&timeMax=${encodeURIComponent(timeMax)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.warn(`No se pudieron cargar eventos para ${calendarId}:`, res.statusText);
    return [];
  }

  const data = await res.json();
  const items = data.items || [];

  return items.map((evt: any) => {
    const startStr = evt.start?.dateTime || (evt.start?.date ? `${evt.start.date}T09:00:00` : new Date().toISOString());
    const endStr = evt.end?.dateTime || (evt.end?.date ? `${evt.end.date}T10:00:00` : startStr);
    const isAllDay = !evt.start?.dateTime && Boolean(evt.start?.date);

    return {
      id: evt.id || `ge-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      calendarId,
      calendarName,
      calendarColor,
      title: evt.summary || '(Sin título)',
      description: evt.description || '',
      location: evt.location || undefined,
      meetLink: evt.hangoutLink || (evt.conferenceData?.entryPoints?.[0]?.uri) || undefined,
      startDateTime: new Date(startStr).toISOString(),
      endDateTime: new Date(endStr).toISOString(),
      isAllDay,
      attendees: (evt.attendees || []).map((att: any) => ({
        email: att.email,
        displayName: att.displayName || att.email,
        responseStatus: att.responseStatus,
        organizer: att.organizer,
      })),
      organizerEmail: evt.organizer?.email,
      htmlLink: evt.htmlLink,
      status: evt.status,
    };
  });
}
