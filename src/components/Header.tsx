import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { GoogleAuthButton } from './GoogleAuthButton';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, CheckSquare, LayoutDashboard, Plus, Moon, Sun, UploadCloud } from 'lucide-react';

interface HeaderProps {
  onOpenNewEvent: () => void;
  onOpenImportICS: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewEvent, onOpenImportICS }) => {
  const { activeTab, setActiveTab, darkMode, toggleDarkMode, stats } = useCalendar();

  const tabs: { id: 'dashboard' | 'calendars' | 'tasks'; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'calendars', label: 'Calendarios', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
    {
      id: 'tasks',
      label: 'Tareas & Flujo',
      icon: <CheckSquare className="w-3.5 h-3.5" />,
      badge: stats.pending > 0 ? stats.pending : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3 bg-white/90 dark:bg-[#191919]/90 backdrop-blur-md border-b border-[#e9e9e7] dark:border-[#2e2e2e] transition-colors">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 shadow-xs">
          <CalendarIcon className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
          ChronoFlow
        </span>
      </div>

      {/* Zone 2: Animated Navigation Tabs */}
      <nav className="flex items-center gap-1 p-1 bg-[#f4f4f2] dark:bg-[#242424] rounded-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-white dark:bg-[#191919] rounded-md shadow-xs -z-0"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="font-mono text-[10px] tabular-nums px-1.5 py-0.2 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded">
                    {tab.badge}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Google Connect + Primary Action + Utilities */}
      <div className="flex items-center gap-2.5 shrink-0">
        <GoogleAuthButton compact />

        <button
          onClick={onOpenImportICS}
          title="Importar calendario desde archivo .ics"
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
        </button>

        <button
          onClick={toggleDarkMode}
          title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenNewEvent}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Evento</span>
        </button>
      </div>
    </header>
  );
};
