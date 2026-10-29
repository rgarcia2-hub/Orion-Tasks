import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarProvider, useCalendar } from './context/CalendarContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CalendarsView } from './components/CalendarsView';
import { TasksKanbanView } from './components/TasksKanbanView';
import { NotesView } from './components/NotesView';
import { EventDetailModal } from './components/EventDetailModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { NewEventModal } from './components/NewEventModal';
import { NewCalendarModal } from './components/NewCalendarModal';
import { ImportICSModal } from './components/ImportICSModal';
import { ToastNotification } from './components/ToastNotification';
import { GoogleTaskConfirmModal } from './components/GoogleTaskConfirmModal';
import { OrionWorkspaceModal } from './components/OrionWorkspaceModal';
import { OrionWorkspaceHub } from './components/OrionWorkspaceHub';
import { AppTransitionScreen } from './components/AppTransitionScreen';
import { OrionCalendarApp } from './components/OrionCalendar/OrionCalendarApp';
import { OrionMailApp } from './components/OrionMail/OrionMailApp';
import { OrionDriveApp } from './components/OrionDrive/OrionDriveApp';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { TermsOfServiceView } from './components/TermsOfServiceView';
import { OrionSpotlight } from './components/OrionSpotlight';
import { OrionDomainAuthModal } from './components/OrionDomainAuthModal';

function MainLayout() {
  const {
    activeTab,
    isCloudSynced,
    isWorkspaceModalOpen,
    setIsWorkspaceModalOpen,
    currentApp,
    isAppTransitioning,
    transitionTarget,
    transitionProgress,
    unauthorizedDomainForModal,
    setUnauthorizedDomainForModal,
  } = useCalendar();

  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [prefilledDateForEvent, setPrefilledDateForEvent] = useState<string | null>(null);
  const [isNewCalendarOpen, setIsNewCalendarOpen] = useState(false);
  const [isImportICSOpen, setIsImportICSOpen] = useState(false);

  const handleOpenNewEvent = (datePrefill?: string) => {
    setPrefilledDateForEvent(datePrefill || null);
    setIsNewEventOpen(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {currentApp === 'hub' ? (
          <motion.div
            key="hub-screen"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="w-full"
          >
            <OrionWorkspaceHub />
          </motion.div>
        ) : currentApp === 'mail' ? (
          <motion.div
            key="mail-screen"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="w-full h-screen"
          >
            <OrionMailApp />
          </motion.div>
        ) : currentApp === 'calendar' ? (
          <motion.div
            key="calendar-screen"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="w-full"
          >
            <OrionCalendarApp />
          </motion.div>
        ) : currentApp === 'drive' ? (
          <motion.div
            key="drive-screen"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="w-full h-screen"
          >
            <OrionDriveApp />
          </motion.div>
        ) : currentApp === 'privacy' ? (
          <motion.div
            key="privacy-screen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            <PrivacyPolicyView />
          </motion.div>
        ) : currentApp === 'terms' ? (
          <motion.div
            key="terms-screen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            <TermsOfServiceView />
          </motion.div>
        ) : (
          <motion.div
            key="tasks-screen"
            initial={{ opacity: 0, scale: 0.995 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.995 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="min-h-screen bg-[#ffffff] dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors flex flex-col justify-between"
          >
            <div>
              {/* Top Bar Header */}
              <Header
                onOpenNewEvent={() => handleOpenNewEvent()}
                onOpenImportICS={() => setIsImportICSOpen(true)}
              />

              {/* Main Content Area with Animated Tab Transitions */}
              <main className="pb-16 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  >
                    {activeTab === 'dashboard' && <DashboardView />}
                    {activeTab === 'calendars' && (
                      <CalendarsView
                        onOpenNewCalendar={() => setIsNewCalendarOpen(true)}
                        onOpenNewEvent={handleOpenNewEvent}
                      />
                    )}
                    {activeTab === 'tasks' && <TasksKanbanView />}
                    {activeTab === 'notes' && <NotesView />}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>

            {/* Subtle Notion-Style Footer */}
            <footer className="border-t border-[#f0f0ee] dark:border-[#252525] py-4 px-6 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
              <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>Orion Workspace</span>
                  <span className="text-neutral-300 dark:text-neutral-700">·</span>
                  <span className="font-medium text-neutral-600 dark:text-neutral-300">Orion Tasks</span>
                  <span className="px-1.5 py-0.2 bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono text-indigo-600 dark:text-indigo-400 rounded">
                    /tasks
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono tabular-nums">
                  <span className={isCloudSynced ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                    {isCloudSynced ? '● Guardado en Google Account (Firestore)' : 'Modo local activo'}
                  </span>
                </div>
              </div>
            </footer>

            {/* Modals */}
            <EventDetailModal />
            <TaskDetailModal />
            <NewEventModal
              isOpen={isNewEventOpen}
              onClose={() => {
                setIsNewEventOpen(false);
                setPrefilledDateForEvent(null);
              }}
              prefillDate={prefilledDateForEvent}
            />
            <NewCalendarModal isOpen={isNewCalendarOpen} onClose={() => setIsNewCalendarOpen(false)} />
            <ImportICSModal isOpen={isImportICSOpen} onClose={() => setIsImportICSOpen(false)} />
            <GoogleTaskConfirmModal />
            <OrionWorkspaceModal
              isOpen={isWorkspaceModalOpen}
              onClose={() => setIsWorkspaceModalOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ToastNotification />
      <OrionSpotlight />

      {/* High-Fidelity Animated App Loading Transition Screen */}
      <AppTransitionScreen
        isOpen={isAppTransitioning}
        targetApp={transitionTarget}
        progress={transitionProgress}
      />

      {/* Domain Authorization Guidance Modal */}
      <OrionDomainAuthModal
        isOpen={Boolean(unauthorizedDomainForModal)}
        onClose={() => setUnauthorizedDomainForModal(null)}
        domain={unauthorizedDomainForModal || undefined}
      />
    </>
  );
}

export default function App() {
  return (
    <CalendarProvider>
      <MainLayout />
    </CalendarProvider>
  );
}
