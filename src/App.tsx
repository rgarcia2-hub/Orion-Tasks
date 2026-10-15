import React, { useState } from 'react';
import { CalendarProvider, useCalendar } from './context/CalendarContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CalendarsView } from './components/CalendarsView';
import { TasksKanbanView } from './components/TasksKanbanView';
import { EventDetailModal } from './components/EventDetailModal';
import { TaskDetailModal } from './components/TaskDetailModal';
import { NewEventModal } from './components/NewEventModal';
import { NewCalendarModal } from './components/NewCalendarModal';
import { ImportICSModal } from './components/ImportICSModal';
import { ToastNotification } from './components/ToastNotification';

function MainLayout() {
  const { activeTab } = useCalendar();
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [prefilledDateForEvent, setPrefilledDateForEvent] = useState<string | null>(null);
  const [isNewCalendarOpen, setIsNewCalendarOpen] = useState(false);
  const [isImportICSOpen, setIsImportICSOpen] = useState(false);

  const handleOpenNewEvent = (datePrefill?: string) => {
    setPrefilledDateForEvent(datePrefill || null);
    setIsNewEventOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#ffffff] dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 font-sans antialiased selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors flex flex-col justify-between">
      <div>
        {/* Top Bar Header */}
        <Header
          onOpenNewEvent={() => handleOpenNewEvent()}
          onOpenImportICS={() => setIsImportICSOpen(true)}
        />

        {/* Main Content Area */}
        <main className="pb-16">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'calendars' && (
            <CalendarsView
              onOpenNewCalendar={() => setIsNewCalendarOpen(true)}
              onOpenNewEvent={handleOpenNewEvent}
            />
          )}
          {activeTab === 'tasks' && <TasksKanbanView />}
        </main>
      </div>

      {/* Subtle Notion-Style Footer */}
      <footer className="border-t border-[#f0f0ee] dark:border-[#252525] py-4 px-6 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ChronoFlow Workspace · Visualizador de Calendarios & Flujo Kanban con Gemini AI
          </div>
          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span>Sincronización local activa</span>
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
      <ToastNotification />
    </div>
  );
}

export default function App() {
  return (
    <CalendarProvider>
      <MainLayout />
    </CalendarProvider>
  );
}
