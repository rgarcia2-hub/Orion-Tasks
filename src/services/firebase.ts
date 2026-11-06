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
import { AuthenticatorToken } from '../types/authenticator';
import { AuthenticatorSecurityConfig } from '../types/authenticatorSecurity';
import {
  encryptTokenE2EE,
  decryptTokenE2EE,
  getActiveVaultKey,
} from '../utils/securityCrypto';

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

// ==========================================
// ORION AUTHENTICATOR (TOTP 2FA CLOUD SYNC)
// ==========================================

export function sanitizeAuthenticatorTokenForFirestore(
  token: AuthenticatorToken,
  userId: string
): Record<string, any> {
  const clean: Record<string, any> = {
    id: token.id,
    userId,
    issuer: token.issuer || 'Servicio',
    account: token.account || '',
    secret: token.secret || '',
    algorithm: token.algorithm || 'SHA1',
    digits: token.digits || 6,
    period: token.period || 30,
    icon: token.icon || 'shield',
    color: token.color || '#7C3AED',
    folder: token.folder || 'General',
    isPinned: Boolean(token.isPinned),
    createdAt: token.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  Object.keys(clean).forEach((k) => {
    if (clean[k] === undefined) {
      delete clean[k];
    }
  });

  return clean;
}

/**
 * Real-time listener for user's Authenticator 2FA tokens.
 * Automatically synchronizes across all devices signed in with the same account.
 * Decrypts E2EE tokens client-side using the unlocked vault master key.
 */
export function subscribeToUserAuthenticatorTokens(
  userId: string,
  onTokensReceived: (tokens: AuthenticatorToken[]) => void,
  onError?: (err: Error) => void,
  vaultKey?: CryptoKey | null
): Unsubscribe {
  const collectionPath = `users/${userId}/authenticator_tokens`;
  const tokensRef = collection(db, 'users', userId, 'authenticator_tokens');

  return onSnapshot(
    tokensRef,
    async (snapshot) => {
      const activeKey = vaultKey || getActiveVaultKey();
      const tokensList: AuthenticatorToken[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.isE2EE && data.ciphertext && data.iv) {
          if (activeKey) {
            try {
              const decrypted = await decryptTokenE2EE(data, activeKey);
              tokensList.push(decrypted);
            } catch (decErr) {
              console.warn('Could not decrypt token with active key:', decErr);
              tokensList.push({
                id: docSnap.id,
                userId,
                issuer: 'Token Cifrado E2EE',
                account: '••••••••',
                secret: '',
                isE2EE: true,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              });
            }
          } else {
            // Vault locked or key not loaded yet: provide protected placeholder
            tokensList.push({
              id: docSnap.id,
              userId,
              issuer: 'Token Cifrado E2EE',
              account: '••••••••',
              secret: '',
              isE2EE: true,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          }
        } else {
          // Legacy unencrypted token
          const legacyToken: AuthenticatorToken = {
            id: docSnap.id,
            userId,
            issuer: data.issuer || 'Servicio',
            account: data.account || '',
            secret: data.secret || '',
            algorithm: data.algorithm || 'SHA1',
            digits: data.digits || 6,
            period: data.period || 30,
            icon: data.icon || 'shield',
            color: data.color || '#7C3AED',
            folder: data.folder || 'General',
            isPinned: Boolean(data.isPinned),
            isE2EE: false,
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
          tokensList.push(legacyToken);

          // Silently upgrade legacy token to zero-knowledge E2EE in cloud if key is active
          if (activeKey && data.secret) {
            encryptTokenE2EE(legacyToken, activeKey).then((encryptedCloud) => {
              setDoc(doc(db, 'users', userId, 'authenticator_tokens', legacyToken.id), encryptedCloud).catch(() => {});
            });
          }
        }
      }

      // Sort pinned first, then by issuer/createdAt
      tokensList.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.issuer.localeCompare(b.issuer);
      });

      onTokensReceived(tokensList);
    },
    (err) => {
      console.error('Error listening to user authenticator tokens from Firestore:', err);
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.GET, collectionPath);
    }
  );
}

/**
 * Saves or updates a single Authenticator 2FA token to user's Firestore cloud database.
 * Encrypts payload with AES-256-GCM before writing to the cloud.
 */
export async function saveAuthenticatorTokenToFirestore(
  userId: string,
  token: AuthenticatorToken,
  vaultKey?: CryptoKey | null
): Promise<void> {
  const path = `users/${userId}/authenticator_tokens/${token.id}`;
  const activeKey = vaultKey || getActiveVaultKey();
  try {
    let payload: Record<string, any>;
    if (activeKey) {
      payload = await encryptTokenE2EE(token, activeKey);
    } else {
      payload = sanitizeAuthenticatorTokenForFirestore(token, userId);
    }
    await setDoc(doc(db, 'users', userId, 'authenticator_tokens', token.id), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Batch saves multiple tokens (e.g. during backup restore or initial migration).
 * Enforces AES-256-GCM client-side encryption.
 */
export async function batchSaveAuthenticatorTokensToFirestore(
  userId: string,
  tokens: AuthenticatorToken[],
  vaultKey?: CryptoKey | null
): Promise<void> {
  const path = `users/${userId}/authenticator_tokens`;
  const activeKey = vaultKey || getActiveVaultKey();
  try {
    const batch = writeBatch(db);
    for (const token of tokens) {
      const docRef = doc(db, 'users', userId, 'authenticator_tokens', token.id);
      let payload: Record<string, any>;
      if (activeKey) {
        payload = await encryptTokenE2EE(token, activeKey);
      } else {
        payload = sanitizeAuthenticatorTokenForFirestore(token, userId);
      }
      batch.set(docRef, payload);
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Permanently deletes a 2FA token from user's Firestore cloud database.
 */
export async function deleteAuthenticatorTokenFromFirestore(
  userId: string,
  tokenId: string
): Promise<void> {
  const path = `users/${userId}/authenticator_tokens/${tokenId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'authenticator_tokens', tokenId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Saves Orion Authenticator security configuration (encrypted PIN hash, passkey, SMS, Email, E2EE).
 */
export async function saveAuthenticatorSecuritySettings(
  userId: string,
  config: AuthenticatorSecurityConfig
): Promise<void> {
  const path = `users/${userId}/authenticator_settings/security`;
  try {
    const payload = {
      isConfigured: Boolean(config.isConfigured),
      primaryMethod: config.primaryMethod || 'pin',
      enabledMethods: config.enabledMethods || { pin: true, passkey: false, email: false, sms: false },
      pinSalt: config.pinSalt || '',
      pinHash: config.pinHash || '',
      pinLength: config.pinLength || 4,
      passkeyCredentialId: config.passkeyCredentialId || '',
      passkeyRegisteredName: config.passkeyRegisteredName || '',
      emailAddress: config.emailAddress || '',
      phoneNumber: config.phoneNumber || '',
      recoveryCodes: Array.isArray(config.recoveryCodes) ? config.recoveryCodes : [],
      usedRecoveryCodes: Array.isArray(config.usedRecoveryCodes) ? config.usedRecoveryCodes : [],
      autoLockMinutes: typeof config.autoLockMinutes === 'number' ? config.autoLockMinutes : 5,
      isE2EEEnabled: config.isE2EEEnabled ?? true,
      e2eeAlgorithm: config.e2eeAlgorithm || 'AES-256-GCM',
      e2eeUpdatedAt: config.e2eeUpdatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', userId, 'authenticator_settings', 'security'), payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Real-time subscription to user's Authenticator security settings.
 */
export function subscribeToAuthenticatorSecuritySettings(
  userId: string,
  onUpdate: (config: AuthenticatorSecurityConfig | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const collectionPath = `users/${userId}/authenticator_settings/security`;
  const docRef = doc(db, 'users', userId, 'authenticator_settings', 'security');

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onUpdate({
          isConfigured: Boolean(data.isConfigured),
          primaryMethod: data.primaryMethod || 'pin',
          enabledMethods: data.enabledMethods || { pin: true, passkey: false, email: false, sms: false },
          pinSalt: data.pinSalt,
          pinHash: data.pinHash,
          pinLength: data.pinLength || 4,
          passkeyCredentialId: data.passkeyCredentialId,
          passkeyRegisteredName: data.passkeyRegisteredName,
          emailAddress: data.emailAddress,
          phoneNumber: data.phoneNumber,
          recoveryCodes: data.recoveryCodes || [],
          usedRecoveryCodes: data.usedRecoveryCodes || [],
          autoLockMinutes: typeof data.autoLockMinutes === 'number' ? data.autoLockMinutes : 5,
          isE2EEEnabled: data.isE2EEEnabled !== false,
          e2eeAlgorithm: data.e2eeAlgorithm || 'AES-256-GCM',
          e2eeUpdatedAt: data.e2eeUpdatedAt,
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Error reading authenticator security settings:', err);
      if (onError) onError(err);
    }
  );
}



