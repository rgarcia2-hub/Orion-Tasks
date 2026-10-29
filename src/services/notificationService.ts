// High-fidelity Desktop & Push Notification Service for Orion Workspace

export interface OrionNotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  type: 'event' | 'task' | 'mail' | 'system';
  read: boolean;
  targetId?: string;
  targetApp?: 'calendar' | 'tasks' | 'mail';
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  leadTimeMinutes: number; // e.g. 5, 10, 15, 30
  notifyEvents: boolean;
  notifyTasks: boolean;
  notifyMail: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  leadTimeMinutes: 10,
  notifyEvents: true,
  notifyTasks: true,
  notifyMail: true,
};

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting desktop notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Synthesizes a warm, non-intrusive two-tone chime via Web Audio API.
 * Requires zero external audio files.
 */
export function playNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (D5 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Second harmonious tone (A5 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.001, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.22, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.55);
  } catch {
    // Ignore audio context block if user has not interacted
  }
}

export interface SendDesktopNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  sound?: boolean;
  onClick?: () => void;
}

/**
 * Dispatches a native desktop notification and plays audio chime.
 */
export async function sendDesktopNotification(
  options: SendDesktopNotificationOptions
): Promise<boolean> {
  const { title, body, icon = '/favicon.svg', tag, sound = true, onClick } = options;

  if (sound) {
    playNotificationSound();
  }

  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Try via ServiceWorkerRegistration if active for background reliability
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag: tag || `orion-${Date.now()}`,
          });
          return true;
        }
      } catch {
        // Fall back to window.Notification below
      }
    }

    // Direct window.Notification
    const notif = new Notification(title, {
      body,
      icon,
      badge: icon,
      tag: tag || `orion-${Date.now()}`,
    });

    if (onClick) {
      notif.onclick = () => {
        try {
          window.focus();
        } catch {}
        onClick();
        notif.close();
      };
    }

    return true;
  } catch (err) {
    console.warn('Native notification failed:', err);
    return false;
  }
}

/**
 * Registers the Service Worker on startup if supported.
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.debug('Service Worker register skipped:', err));
    });
  }
}
