export const ORION_ADMIN_EMAIL = 'robert.garcia.alsina2012@gmail.com';

export function isOrionAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ORION_ADMIN_EMAIL.toLowerCase();
}

export type MailFolder = 'inbox' | 'starred' | 'sent' | 'drafts' | 'trash';

export type MailAccountFilter = 'all' | 'gmail' | 'internal';

export interface OrionEmail {
  id: string;
  userId?: string;
  source: 'gmail' | 'internal';
  from: {
    name: string;
    email: string;
    avatarUrl?: string;
    isAdmin?: boolean;
  };
  to: string[];
  subject: string;
  preview: string;
  body: string;
  bodyHtml?: string;
  hasImages?: boolean;
  date: string; // ISO string or human-readable
  timestamp: number; // for sorting
  folder: MailFolder;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  isAdminOfficial?: boolean;
  sendAccount?: 'gmail' | 'orion';
  attachments?: {
    name: string;
    size: string;
    type: string;
    url?: string;
  }[];
}

export interface ComposeEmailData {
  to: string;
  subject: string;
  body: string;
  sendAccount: 'gmail' | 'orion';
  asAdminOfficial?: boolean;
  isDraft?: boolean;
}
