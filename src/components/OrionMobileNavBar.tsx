import React, { useState } from 'react';
import {
  LayoutGrid,
  CheckSquare,
  CalendarDays,
  Mail,
  Menu,
  HardDrive,
  Shield,
} from 'lucide-react';
import { useCalendar } from '../context/CalendarContext';
import { OrionMobileAppDrawer } from './OrionMobileAppDrawer';

export const OrionMobileNavBar: React.FC = () => {
  const { currentApp, setCurrentApp } = useCalendar();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Determine if active app is in the primary 4 or in the 'more' drawer
  const isPrimaryApp = ['hub', 'tasks', 'calendar', 'mail'].includes(currentApp);

  return (
    <>
      <nav
        aria-label="Navegación móvil inferior"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xl border-t border-neutral-200/80 dark:border-neutral-800/80 shadow-lg px-2 select-none"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
      >
        <div className="flex items-center justify-around h-14 max-w-md mx-auto">
          {/* 1. Hub */}
          <button
            type="button"
            onClick={() => setCurrentApp('hub')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-all ${
              currentApp === 'hub'
                ? 'text-violet-600 dark:text-violet-400 font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <LayoutGrid className="w-5 h-5" />
              {currentApp === 'hub' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600 dark:bg-violet-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Hub</span>
          </button>

          {/* 2. Tasks */}
          <button
            type="button"
            onClick={() => setCurrentApp('tasks')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-all ${
              currentApp === 'tasks'
                ? 'text-violet-600 dark:text-violet-400 font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <CheckSquare className="w-5 h-5" />
              {currentApp === 'tasks' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600 dark:bg-violet-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Tareas</span>
          </button>

          {/* 3. Calendar */}
          <button
            type="button"
            onClick={() => setCurrentApp('calendar')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-all ${
              currentApp === 'calendar'
                ? 'text-violet-600 dark:text-violet-400 font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <CalendarDays className="w-5 h-5" />
              {currentApp === 'calendar' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600 dark:bg-violet-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Calendario</span>
          </button>

          {/* 4. Mail */}
          <button
            type="button"
            onClick={() => setCurrentApp('mail')}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-all ${
              currentApp === 'mail'
                ? 'text-violet-600 dark:text-violet-400 font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Mail className="w-5 h-5" />
              {currentApp === 'mail' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600 dark:bg-violet-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">Correo</span>
          </button>

          {/* 5. More Apps (Drawer) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 transition-all ${
              !isPrimaryApp
                ? 'text-violet-600 dark:text-violet-400 font-semibold'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              {currentApp === 'drive' ? (
                <HardDrive className="w-5 h-5" />
              ) : currentApp === 'authenticator' ? (
                <Shield className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
              {!isPrimaryApp && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-600 dark:bg-violet-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">
              {currentApp === 'drive'
                ? 'Drive'
                : currentApp === 'authenticator'
                ? 'Auth'
                : 'Más'}
            </span>
          </button>
        </div>
      </nav>

      {/* Slide-Up App Drawer */}
      <OrionMobileAppDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};
