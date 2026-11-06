/**
 * Utility to manage permanently dismissed notifications and tip banners per account.
 * Persists in localStorage isolated by account UID/email so that dismissed notices
 * never reappear for that user.
 */

export function isBannerDismissed(bannerId: string, accountKey?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const key = accountKey ? accountKey.trim().toLowerCase() : 'global';
    const storageKey = `orion_dismissed_banners_${key}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.includes(bannerId);
  } catch {
    return false;
  }
}

export function dismissBannerPermanently(bannerId: string, accountKey?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const key = accountKey ? accountKey.trim().toLowerCase() : 'global';
    const storageKey = `orion_dismissed_banners_${key}`;
    const raw = localStorage.getItem(storageKey);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(bannerId)) {
      list.push(bannerId);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  } catch (err) {
    console.warn('Could not save dismissed banner:', err);
  }
}
