import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { GoogleAuthButton } from './GoogleAuthButton';
import { OrionLogo } from './OrionLogo';
import { OrionAppSwitcher } from './OrionAppSwitcher';
import { OrionNotificationCenter } from './OrionNotificationCenter';
import { motion } from 'motion/react';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  LayoutDashboard,
  Plus,
  Moon,
  Sun,
  UploadCloud,
  FileText,
  LayoutGrid,
  ChevronDown,
  Search,
} from 'lucide-react';

interface HeaderProps {
  onOpenNewEvent: () => void;
  onOpenImportICS: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewEvent, onOpenImportICS }) => {
  const {
    activeTab,
    setActiveTab,
    darkMode,
    toggleDarkMode,
    stats,
    isCloudSynced,
    user,
    addNote,
    setIsWorkspaceModalOpen,
    setCurrentApp,
    setIsSpotlightOpen,
  } = useCalendar();

  const tabs: {
    id: 'dashboard' | 'calendars' | 'tasks' | 'notes';
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Inicio', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'calendars', label: 'Calendarios', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
    {
      id: 'tasks',
      label: 'Tareas & Flujo',
      icon: <CheckSquare className="w-3.5 h-3.5" />,
      badge: stats.pending > 0 ? stats.pending : undefined,
    },
    {
      id: 'notes',
      label: 'Notas',
      icon: <FileText className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-6 py-2.5 bg-white/90 dark:bg-[#191919]/90 backdrop-blur-md border-b border-[#e9e9e7] dark:border-[#2e2e2e] transition-colors">
      {/* Zone 1: Orion Brand Logo & Orion Tasks App Indicator */}
      <div className="flex items-center gap-3 shrink-0">
        <OrionAppSwitcher currentAppName="tasks" />

        {user && (
          <span
            className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-md border ${
              isCloudSynced
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60'
            }`}
            title={isCloudSynced ? 'Guardado en tu cuenta de Google (Firestore)' : 'Sincronizando con tu cuenta...'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            {isCloudSynced ? 'Nube Activa' : 'Sincronizando'}
          </span>
        )}
      </div>

      {/* Zone 2: Animated Navigation Tabs (4 tabs) */}
      <nav className="flex items-center gap-1 p-1 bg-[#f4f4f2] dark:bg-[#242424] rounded-lg overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
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

      {/* Zone 3: Google Connect + Utilities */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsSpotlightOpen(true)}
          title="Buscar en Orion (Ctrl/Cmd + K)"
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800 transition-colors cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline text-neutral-400 dark:text-neutral-500 font-normal">Buscar...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 border border-neutral-300/40 dark:border-neutral-700">⌘K</kbd>
        </button>

        <button
          onClick={() => setCurrentApp('hub')}
          title="Orion Workspace Hub · Selector de Aplicaciones"
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        <OrionNotificationCenter />

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

        {activeTab === 'notes' ? (
          <button
            onClick={() => {
              addNote({
                title: 'Nota sin título',
                content: '',
                tags: ['Ideas'],
                color: '#3B82F6',
                isPinned: false,
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            title="Crear una nueva nota"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Nota</span>
          </button>
        ) : (
          <button
            onClick={onOpenNewEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Evento</span>
          </button>
        )}
      </div>
    </header>
  );
};
