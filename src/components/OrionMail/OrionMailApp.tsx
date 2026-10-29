import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MailFolder,
  MailAccountFilter,
  OrionEmail,
  ComposeEmailData,
  isOrionAdmin,
  ORION_ADMIN_EMAIL,
} from '../../types/mail';
import {
  loadCachedEmails,
  saveCachedEmails,
  subscribeToInternalEmails,
  fetchGmailMessages,
  sendGmailMessage,
  persistEmailUpdate,
  persistEmailDelete,
} from '../../services/mailService';
import { MailSidebar } from './MailSidebar';
import { MailThreadList } from './MailThreadList';
import { MailReaderView } from './MailReaderView';
import { MailComposeModal } from './MailComposeModal';
import { OrionLogo } from '../OrionLogo';
import { OrionAppSwitcher } from '../OrionAppSwitcher';
import { BetaFlaskIcon } from '../BetaFlaskIcon';
import { GoogleAuthButton } from '../GoogleAuthButton';
import { OrionNotificationCenter } from '../OrionNotificationCenter';
import { useCalendar } from '../../context/CalendarContext';
import { Sun, Moon, Sparkles, RefreshCw, Layers } from 'lucide-react';

export const OrionMailApp: React.FC = () => {
  const { user, googleToken, isGoogleConnected, darkMode, toggleDarkMode, navigateToApp, loginWithGoogle } =
    useCalendar();

  const [internalEmails, setInternalEmails] = useState<OrionEmail[]>(loadCachedEmails);
  const [gmailEmails, setGmailEmails] = useState<OrionEmail[]>([]);
  const [currentFolder, setCurrentFolder] = useState<MailFolder>('inbox');
  const [accountFilter, setAccountFilter] = useState<MailAccountFilter>('all');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Firestore subscription for internal emails
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToInternalEmails(user.uid, (emails) => {
        setInternalEmails(emails);
      });
      return () => unsubscribe();
    } else {
      setInternalEmails(loadCachedEmails());
    }
  }, [user?.uid]);

  // Fetch real Gmail messages when Google token is present
  const refreshGmail = async (token?: string | null) => {
    const activeToken = token || googleToken;
    if (!activeToken) return;
    setIsRefreshing(true);
    try {
      const messages = await fetchGmailMessages(activeToken);
      if (messages.length > 0) {
        setGmailEmails(messages);
      }
    } catch (e) {
      console.error('Error fetching Gmail:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (googleToken) {
      refreshGmail(googleToken);
    }
  }, [googleToken]);

  // Combined and filtered emails list
  const allEmails = useMemo(() => {
    let list: OrionEmail[] = [];
    if (accountFilter === 'all') {
      list = [...internalEmails, ...gmailEmails];
    } else if (accountFilter === 'gmail') {
      list = [...gmailEmails];
    } else {
      list = [...internalEmails];
    }

    // Filter by folder
    if (currentFolder === 'starred') {
      return list.filter((e) => e.isStarred && e.folder !== 'trash');
    }
    return list.filter((e) => e.folder === currentFolder);
  }, [internalEmails, gmailEmails, accountFilter, currentFolder]);

  // Auto-select first email if none selected or if selected email is no longer in view
  useEffect(() => {
    if (allEmails.length > 0) {
      const exists = allEmails.some((e) => e.id === selectedEmailId);
      if (!exists && !selectedEmailId) {
        setSelectedEmailId(allEmails[0].id);
      }
    } else {
      setSelectedEmailId(null);
    }
  }, [allEmails, selectedEmailId]);

  // Selected email object
  const selectedEmail = useMemo(() => {
    if (!selectedEmailId) return null;
    return (
      internalEmails.find((e) => e.id === selectedEmailId) ||
      gmailEmails.find((e) => e.id === selectedEmailId) ||
      null
    );
  }, [selectedEmailId, internalEmails, gmailEmails]);

  // Count badges
  const unreadCount = useMemo(() => {
    return internalEmails.filter((e) => e.folder === 'inbox' && !e.isRead).length;
  }, [internalEmails]);

  const starredCount = useMemo(() => {
    return internalEmails.filter((e) => e.isStarred && e.folder !== 'trash').length;
  }, [internalEmails]);

  const draftsCount = useMemo(() => {
    return internalEmails.filter((e) => e.folder === 'drafts').length;
  }, [internalEmails]);

  // Actions
  const handleToggleStar = (emailId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setInternalEmails((prev) => {
      const updated = prev.map((em) => {
        if (em.id === emailId) {
          const newEm = { ...em, isStarred: !em.isStarred };
          persistEmailUpdate(user?.uid || null, newEm);
          return newEm;
        }
        return em;
      });
      saveCachedEmails(updated);
      return updated;
    });

    setGmailEmails((prev) =>
      prev.map((em) => (em.id === emailId ? { ...em, isStarred: !em.isStarred } : em))
    );
  };

  const handleToggleRead = (emailId: string) => {
    setInternalEmails((prev) => {
      const updated = prev.map((em) => {
        if (em.id === emailId) {
          const newEm = { ...em, isRead: !em.isRead };
          persistEmailUpdate(user?.uid || null, newEm);
          return newEm;
        }
        return em;
      });
      saveCachedEmails(updated);
      return updated;
    });

    setGmailEmails((prev) =>
      prev.map((em) => (em.id === emailId ? { ...em, isRead: !em.isRead } : em))
    );
  };

  const handleSelectEmail = (email: OrionEmail) => {
    setSelectedEmailId(email.id);
    if (!email.isRead) {
      handleToggleRead(email.id);
    }
  };

  const handleDeleteEmail = (emailId: string) => {
    const isInternal = internalEmails.some((e) => e.id === emailId);
    if (isInternal) {
      setInternalEmails((prev) => {
        const target = prev.find((e) => e.id === emailId);
        if (!target) return prev;
        if (target.folder === 'trash') {
          // Permanently delete
          persistEmailDelete(user?.uid || null, emailId);
          const filtered = prev.filter((e) => e.id !== emailId);
          saveCachedEmails(filtered);
          return filtered;
        } else {
          // Move to trash
          const updated = prev.map((e) => (e.id === emailId ? { ...e, folder: 'trash' as MailFolder } : e));
          persistEmailUpdate(user?.uid || null, { ...target, folder: 'trash' });
          saveCachedEmails(updated);
          return updated;
        }
      });
    } else {
      setGmailEmails((prev) => prev.filter((e) => e.id !== emailId));
    }
  };

  const handleSendEmail = async (data: ComposeEmailData) => {
    setIsSending(true);
    const isAdmin = isOrionAdmin(user?.email);
    const isSendingAsAdminOfficial = isAdmin && Boolean(data.asAdminOfficial);

    // 1. If sending via Gmail API
    if (data.sendAccount === 'gmail') {
      if (!googleToken) {
        setIsSending(false);
        alert('Por favor conecta tu cuenta de Google con permisos de Gmail para enviar este correo.');
        return;
      }

      const cleanPreview = (text: string) =>
        text
          .replace(/!\[.*?\]\(.*?\)/g, '[Imagen]')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/[*_~`#>]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120);

      try {
        const result = await sendGmailMessage(googleToken, data.to, data.subject, data.body);
        const hasImages = /<img|!\[.*?\]\(.*?\)/i.test(data.body);

        const sentGmailEmail: OrionEmail = {
          id: `gmail-sent-${result.id || Date.now()}`,
          source: 'gmail',
          from: {
            name: user?.displayName || 'Robert García',
            email: user?.email || 'robert.garcia.alsina2012@gmail.com',
            isAdmin: isAdmin,
          },
          to: [data.to],
          subject: data.subject,
          preview: cleanPreview(data.body),
          body: data.body,
          hasImages,
          date: new Date().toISOString(),
          timestamp: Date.now(),
          folder: 'sent',
          isRead: true,
          isStarred: false,
          labels: ['Gmail', 'Enviados'],
          isAdminOfficial: false,
        };

        setGmailEmails((prev) => [sentGmailEmail, ...prev]);
        setSelectedEmailId(sentGmailEmail.id);
        setCurrentFolder('sent');

        // Refresh Gmail in background to sync
        setTimeout(() => {
          refreshGmail(googleToken);
        }, 1200);
      } catch (err: any) {
        console.error('Error sending email through Gmail:', err);
        alert(`Error al enviar correo vía Gmail: ${err.message || 'Verifica los permisos en Google'}`);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // 2. If sending via Orion Internal (Cloud Firestore)
    try {
      const senderName = isSendingAsAdminOfficial
        ? 'Orion Workspace Oficial (Robert García)'
        : user?.displayName || 'Usuario Orion';
      const senderEmail = isSendingAsAdminOfficial
        ? 'team@orionworkspace.com'
        : user?.email || 'me@orion.app';

      const cleanPreview = (text: string) =>
        text
          .replace(/!\[.*?\]\(.*?\)/g, '[Imagen]')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .replace(/[*_~`#>]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 120);

      const hasImages = /<img|!\[.*?\]\(.*?\)/i.test(data.body);

      const newEmail: OrionEmail = {
        id: `internal-${Date.now()}`,
        userId: user?.uid,
        source: 'internal',
        from: {
          name: senderName,
          email: senderEmail,
          isAdmin: isSendingAsAdminOfficial,
        },
        to: [data.to],
        subject: data.subject,
        preview: cleanPreview(data.body),
        body: data.body,
        hasImages,
        date: new Date().toISOString(),
        timestamp: Date.now(),
        folder: 'sent',
        isRead: true,
        isStarred: false,
        labels: isSendingAsAdminOfficial ? ['Oficial', 'Orion Admin', 'Enviados'] : ['Enviados'],
        isAdminOfficial: isSendingAsAdminOfficial,
      };

      setInternalEmails((prev) => {
        const updated = [newEmail, ...prev];
        persistEmailUpdate(user?.uid || null, newEmail);
        saveCachedEmails(updated);
        return updated;
      });

      // If sent to self, broadcast, or admin announcement, also copy into inbox
      const isBroadcast =
        data.to.toLowerCase().includes('todos') ||
        data.to.toLowerCase().includes('broadcast') ||
        data.to.toLowerCase() === (user?.email || '').toLowerCase() ||
        isSendingAsAdminOfficial;

      if (isBroadcast) {
        const inboxCopy: OrionEmail = {
          ...newEmail,
          id: `internal-copy-${Date.now()}`,
          folder: 'inbox',
          isRead: false,
        };
        setInternalEmails((prev) => {
          const updated = [inboxCopy, ...prev];
          persistEmailUpdate(user?.uid || null, inboxCopy);
          saveCachedEmails(updated);
          return updated;
        });
      }

      setSelectedEmailId(newEmail.id);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = (data: ComposeEmailData) => {
    const hasImages = /<img|!\[.*?\]\(.*?\)/i.test(data.body);
    const draftEmail: OrionEmail = {
      id: `draft-${Date.now()}`,
      userId: user?.uid,
      source: 'internal',
      from: {
        name: user?.displayName || 'Borrador',
        email: user?.email || 'me@orion.app',
      },
      to: data.to ? [data.to] : [],
      subject: data.subject || '(Borrador sin asunto)',
      preview: data.body.slice(0, 100),
      body: data.body,
      hasImages,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      folder: 'drafts',
      isRead: true,
      isStarred: false,
      labels: ['Borradores'],
    };

    setInternalEmails((prev) => {
      const updated = [draftEmail, ...prev];
      persistEmailUpdate(user?.uid || null, draftEmail);
      saveCachedEmails(updated);
      return updated;
    });
  };

  const handleReply = (email: OrionEmail, replyText: string) => {
    const replyBody = `${replyText}\n\n--- Mensaje original de ${email.from.name} ---\n${email.body}`;
    const hasImages = /<img|!\[.*?\]\(.*?\)/i.test(replyBody);

    const replyEmail: OrionEmail = {
      id: `reply-${Date.now()}`,
      userId: user?.uid,
      source: 'internal',
      from: {
        name: user?.displayName || 'Robert García',
        email: user?.email || 'me@orion.app',
      },
      to: [email.from.email],
      subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
      preview: replyText.slice(0, 120),
      body: replyBody,
      hasImages,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      folder: 'sent',
      isRead: true,
      isStarred: false,
      labels: ['Respuestas'],
    };

    setInternalEmails((prev) => {
      const updated = [replyEmail, ...prev];
      persistEmailUpdate(user?.uid || null, replyEmail);
      saveCachedEmails(updated);
      return updated;
    });
  };

  return (
    <div className="h-screen w-screen bg-[#fafafa] dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 flex flex-col overflow-hidden font-sans antialiased">
      {/* Top Bar for Orion Mail - unified with Orion Calendar and Tasks */}
      <header className="h-12 px-4 sm:px-6 border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-white/95 dark:bg-[#181818]/95 backdrop-blur-md flex items-center justify-between shrink-0 select-none z-30">
        <div className="flex items-center gap-3 shrink-0">
          <OrionAppSwitcher currentAppName="mail" />

          {isGoogleConnected ? (
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Gmail sincronizado</span>
            </div>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
              <span>Buzón local</span>
            </div>
          )}
        </div>

        {/* Right tools: Notifications, Google Account & Dark Mode */}
        <div className="flex items-center gap-2">

          <OrionNotificationCenter />

          <GoogleAuthButton />

          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 3-Column Workspace Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Navigation & Folders */}
        <MailSidebar
          currentFolder={currentFolder}
          onSelectFolder={setCurrentFolder}
          accountFilter={accountFilter}
          onChangeAccountFilter={setAccountFilter}
          unreadCount={unreadCount}
          starredCount={starredCount}
          draftsCount={draftsCount}
          onOpenCompose={() => setIsComposeOpen(true)}
          onRefresh={() => refreshGmail()}
          isRefreshing={isRefreshing}
        />

        {/* Column 2: Thread List */}
        <MailThreadList
          emails={allEmails}
          selectedEmailId={selectedEmailId}
          onSelectEmail={handleSelectEmail}
          onToggleStar={handleToggleStar}
          folder={currentFolder}
          onOpenCompose={() => setIsComposeOpen(true)}
        />

        {/* Column 3: Message Reader View */}
        <MailReaderView
          email={selectedEmail}
          onToggleStar={handleToggleStar}
          onToggleRead={handleToggleRead}
          onDeleteEmail={handleDeleteEmail}
          onReply={handleReply}
        />
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {isComposeOpen && (
          <MailComposeModal
            isOpen={isComposeOpen}
            onClose={() => setIsComposeOpen(false)}
            onSend={handleSendEmail}
            onSaveDraft={handleSaveDraft}
            isSending={isSending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
