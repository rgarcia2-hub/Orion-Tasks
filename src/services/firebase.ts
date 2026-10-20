import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDocFromServer,
  getDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppTask, AppNote } from '../types/calendar';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = firestoreDbId && firestoreDbId !== '(default)' ? getFirestore(app, firestoreDbId) : getFirestore(app);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on startup as mandated by Firestore guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline. Please check connection.');
      return false;
    }
    // Benign test probe
    return true;
  }
}

// Clean and sanitize task data before writing to Firestore (omits undefined values)
export function sanitizeTaskForFirestore(task: AppTask, userId: string): Record<string, any> {
  const clean: Record<string, any> = {
    id: task.id,
    userId,
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'pending',
    priority: task.priority || 'medium',
    calendarId: task.calendarId || 'default',
    calendarName: task.calendarName || 'General',
    calendarColor: task.calendarColor || '#3B82F6',
    isAllDay: Boolean(task.isAllDay),
    notes: task.notes || '',
    tags: Array.isArray(task.tags) ? task.tags : [],
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks.map((st) => ({
          id: st.id,
          text: st.text,
          completed: Boolean(st.completed),
        }))
      : [],
    createdAt: task.createdAt || new Date().toISOString(),
  };

  if (task.sourceEventId) clean.sourceEventId = task.sourceEventId;
  if (task.startDateTime) clean.startDateTime = task.startDateTime;
  if (task.endDateTime) clean.endDateTime = task.endDateTime;
  if (task.location) clean.location = task.location;
  if (task.meetLink) clean.meetLink = task.meetLink;
  if (task.completedAt) clean.completedAt = task.completedAt;
  if (task.googleTaskId) clean.googleTaskId = task.googleTaskId;
  if (task.googleTaskListId) clean.googleTaskListId = task.googleTaskListId;
  if (task.aiAnalysis) clean.aiAnalysis = task.aiAnalysis;

  return clean;
}

// Real-time synchronization of user tasks from Firestore
export function subscribeToUserTasks(
  userId: string,
  onTasksReceived: (tasks: AppTask[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/tasks`;
  const tasksRef = collection(db, 'users', userId, 'tasks');

  return onSnapshot(
    tasksRef,
    (snapshot) => {
      const tasksList: AppTask[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tasksList.push({
          id: docSnap.id,
          sourceEventId: data.sourceEventId,
          calendarId: data.calendarId || 'default',
          calendarName: data.calendarName || 'General',
          calendarColor: data.calendarColor || '#3B82F6',
          title: data.title || '',
          description: data.description || '',
          location: data.location,
          meetLink: data.meetLink,
          startDateTime: data.startDateTime || '',
          endDateTime: data.endDateTime || '',
          isAllDay: Boolean(data.isAllDay),
          status: data.status || 'pending',
          priority: data.priority || 'medium',
          notes: data.notes || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          subtasks: Array.isArray(data.subtasks) ? data.subtasks : [],
          aiAnalysis: data.aiAnalysis,
          createdAt: data.createdAt || new Date().toISOString(),
          completedAt: data.completedAt,
          googleTaskId: data.googleTaskId,
          googleTaskListId: data.googleTaskListId,
        });
      });
      onTasksReceived(tasksList);
    },
    (err) => {
      console.error('Error listening to user tasks from Firestore:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, collectionPath);
    }
  );
}

// Save single task in user's Firestore subcollection
export async function saveTaskToFirestore(userId: string, task: AppTask): Promise<void> {
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const payload = sanitizeTaskForFirestore(task, userId);
    await setDoc(doc(db, 'users', userId, 'tasks', task.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Batch save multiple tasks (used during initial migration / Google Calendar sync)
export async function batchSaveTasksToFirestore(userId: string, tasksList: AppTask[]): Promise<void> {
  if (tasksList.length === 0) return;
  const path = `users/${userId}/tasks`;
  try {
    const batch = writeBatch(db);
    tasksList.forEach((task) => {
      const ref = doc(db, 'users', userId, 'tasks', task.id);
      batch.set(ref, sanitizeTaskForFirestore(task, userId));
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete task from user's Firestore subcollection
export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// User document for preferences (e.g. default calendar, theme, sync settings)
export async function syncUserProfile(user: { uid: string; email?: string | null; displayName?: string | null; defaultCalendarId?: string | null }) {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Usuario de Orion',
        defaultCalendarId: user.defaultCalendarId || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user profile to Firestore:', err);
  }
}

// User settings & state (completed event IDs, stats, theme preferences, PRO membership)
export async function syncUserSettings(
  userId: string,
  settings: {
    completedEventIds?: string[];
    historicalCompletedCount?: number;
    defaultCalendarId?: string | null;
    isProMember?: boolean;
  }
) {
  const path = `users/${userId}`;
  try {
    await setDoc(
      doc(db, 'users', userId),
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user settings to Firestore:', err);
  }
}

export async function getUserSettings(userId: string): Promise<{
  completedEventIds?: string[];
  historicalCompletedCount?: number;
  defaultCalendarId?: string | null;
  isProMember?: boolean;
} | null> {
  const path = `users/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      return snap.data() as any;
    }
  } catch (err) {
    console.warn('Could not fetch user settings from Firestore:', err);
  }
  return null;
}

// Clean and sanitize note data for Firestore
export function sanitizeNoteForFirestore(note: AppNote, userId: string): Record<string, any> {
  const clean: Record<string, any> = {
    id: note.id,
    userId,
    title: note.title || 'Sin título',
    content: note.content || '',
    tags: Array.isArray(note.tags) ? note.tags : [],
    isPinned: Boolean(note.isPinned),
    createdAt: note.createdAt || new Date().toISOString(),
    updatedAt: note.updatedAt || new Date().toISOString(),
  };

  if (note.color) clean.color = note.color;
  if (note.linkedTaskId) clean.linkedTaskId = note.linkedTaskId;
  if (note.linkedEventId) clean.linkedEventId = note.linkedEventId;

  return clean;
}

// Real-time synchronization of user notes from Firestore
export function subscribeToUserNotes(
  userId: string,
  onNotesReceived: (notes: AppNote[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/notes`;
  const notesRef = collection(db, 'users', userId, 'notes');

  return onSnapshot(
    notesRef,
    (snapshot) => {
      const notesList: AppNote[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        notesList.push({
          id: docSnap.id,
          userId,
          title: data.title || '',
          content: data.content || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          color: data.color,
          isPinned: Boolean(data.isPinned),
          linkedTaskId: data.linkedTaskId,
          linkedEventId: data.linkedEventId,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      onNotesReceived(notesList);
    },
    (err) => {
      console.error('Error listening to user notes from Firestore:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, collectionPath);
    }
  );
}

// Save single note in user's Firestore subcollection
export async function saveNoteToFirestore(userId: string, note: AppNote): Promise<void> {
  const path = `users/${userId}/notes/${note.id}`;
  try {
    const payload = sanitizeNoteForFirestore(note, userId);
    await setDoc(doc(db, 'users', userId, 'notes', note.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Delete note from user's Firestore subcollection
export async function deleteNoteFromFirestore(userId: string, noteId: string): Promise<void> {
  const path = `users/${userId}/notes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'notes', noteId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

