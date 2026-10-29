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
const TOKEN_EXPIRY_KEY = 'orion_google_access_token_expiry_v3';

export const isStoredTokenValid = (): boolean => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) return false;
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiry) {
      const expTime = parseInt(expiry, 10);
      if (!isNaN(expTime) && Date.now() > expTime) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
};

export const clearStoredAccessToken = () => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (e) {
    console.error(e);
  }
};

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    if (!isStoredTokenValid()) {
      clearStoredAccessToken();
      return null;
    }
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
      if (!isStoredTokenValid()) {
        clearStoredAccessToken();
        cachedAccessToken = null;
      } else if (!cachedAccessToken) {
        try {
          cachedAccessToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        } catch {
          cachedAccessToken = null;
        }
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!isSigningIn) {
      clearStoredAccessToken();
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
      // Google access tokens expire in 1 hour; store 55-minute expiry timestamp
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 55 * 60 * 1000));
    } catch (e) {
      console.error(e);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error durante el inicio de sesión con Google:', error);
    if (
      error?.code === 'auth/unauthorized-domain' ||
      error?.message?.includes('unauthorized-domain') ||
      error?.message?.includes('not authorized')
    ) {
      error.isUnauthorizedDomain = true;
      error.unauthorizedHost = typeof window !== 'undefined' ? window.location.hostname : 'orionworkspace.vercel.app';
      error.friendlyMessage = `El dominio "${error.unauthorizedHost}" no está autorizado en Firebase Authentication. Añádelo en la consola de Firebase.`;
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!isStoredTokenValid()) {
    clearStoredAccessToken();
    return null;
  }
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
  clearStoredAccessToken();
};

// Fetch real Google Calendars from Google Calendar API
export async function fetchGoogleCalendars(accessToken: string): Promise<Calendar[]> {
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
    return [];
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearStoredAccessToken();
      const authErr = new Error('TOKEN_EXPIRED');
      (authErr as any).isAuthExpired = true;
      (authErr as any).status = 401;
      throw authErr;
    }
    const err = await res.json().catch(() => ({}));
    const message = err.error?.message || `Error al obtener calendarios: ${res.statusText}`;
    const customErr = new Error(message);
    (customErr as any).status = res.status;
    throw customErr;
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
    const isAllDay = !evt.start?.dateTime && Boolean(evt.start?.date);
    const startStr = evt.start?.dateTime || (evt.start?.date ? `${evt.start.date}T00:00:00` : new Date().toISOString());
    const endStr = evt.end?.dateTime || (evt.end?.date ? `${evt.end.date}T23:59:59` : startStr);

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
