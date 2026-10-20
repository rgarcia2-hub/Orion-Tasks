import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendar } from '../context/CalendarContext';
import { OrionLogo } from './OrionLogo';
import { BetaFlaskIcon } from './BetaFlaskIcon';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Mail,
  HardDrive,
  ChevronDown,
  Check,
  Grid,
  ExternalLink,
} from 'lucide-react';

interface OrionAppSwitcherProps {
  currentAppName?: 'tasks' | 'calendar' | 'mail';
}

export const OrionAppSwitcher: React.FC<OrionAppSwitcherProps> = ({ currentAppName }) => {
  const { setCurrentApp } = useCalendar();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const apps = [
    {
      id: 'calendar' as const,
      name: 'Orion Calendar',
      subUrl: '/calendar',
      description: 'Calendario unificado, vistas de semana, mes y agenda',
      isActive: currentAppName === 'calendar',
      isAvailable: true,
      icon: (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <CalendarDays className="w-4.5 h-4.5" />
        </div>
      ),
    },
    {
      id: 'tasks' as const,
      name: 'Orion Tasks',
      subUrl: '/tasks',
      description: 'Tablero Kanban de flujo, tareas y notas',
      isActive: currentAppName === 'tasks',
      isAvailable: true,
      icon: (
        <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shrink-0 shadow-xs">
          <CalendarIcon className="w-4.5 h-4.5" />
        </div>
      ),
    },
    {
      id: 'mail' as const,
      name: 'Orion Mail',
      subUrl: '/mail',
      description: 'Cliente de correo híbrido (Gmail + Cloud Firestore)',
      isActive: currentAppName === 'mail',
      isAvailable: true,
      badge: 'Beta',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Mail className="w-4.5 h-4.5" />
        </div>
      ),
    },
    {
      id: 'drive' as const,
      name: 'Orion Drive',
      subUrl: '/drive',
      description: 'Almacenamiento seguro en la nube',
      isActive: false,
      isAvailable: false,
      badge: 'Soon',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow-xs opacity-70">
          <HardDrive className="w-4.5 h-4.5" />
        </div>
      ),
    },
  ];

  return (
    <div className="relative inline-flex items-center gap-2" ref={dropdownRef}>
      {/* Orion Brand Logo - clicking it returns to Hub */}
      <button
        onClick={() => setCurrentApp('hub')}
        className="flex items-center gap-2 text-left group cursor-pointer focus:outline-hidden"
        title="Volver al Hub de Orion Workspace"
      >
        <OrionLogo size={30} className="w-7.5 h-7.5 rounded-lg shadow-sm transition-transform duration-200 group-hover:scale-105" />
        <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
          Orion
        </span>
      </button>

      {/* App Switcher Pill */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
          isOpen
            ? 'bg-neutral-200/80 dark:bg-[#333333] border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
            : 'bg-[#f4f4f2] hover:bg-[#eaeae8] dark:bg-[#252525] dark:hover:bg-[#2e2e2e] border-neutral-200/70 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200'
        }`}
        title="Cambiar de app en Orion Workspace"
      >
        {currentAppName === 'calendar' ? (
          <div className="w-4 h-4 rounded-sm bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <CalendarDays className="w-2.5 h-2.5" />
          </div>
        ) : currentAppName === 'mail' ? (
          <div className="w-4 h-4 rounded-sm bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-2xs">
            <Mail className="w-2.5 h-2.5" />
          </div>
        ) : (
          <div className="w-4 h-4 rounded-sm bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 shadow-2xs">
            <CalendarIcon className="w-2.5 h-2.5" />
          </div>
        )}
        <span className="capitalize">{currentAppName === 'calendar' ? 'Calendar' : currentAppName === 'mail' ? 'Mail' : 'Tasks'}</span>
        <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Apps Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute top-full left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#202020] border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#f0f0ee] dark:border-[#2c2c2c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                  Orion Workspace
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">Suite</span>
            </div>

            {/* Apps List */}
            <div className="p-2 space-y-1">
              {apps.map((app) => (
                <button
                  key={app.id}
                  disabled={!app.isAvailable}
                  onClick={() => {
                    if (!app.isAvailable) return;
                    setIsOpen(false);
                    if (app.id === 'tasks') setCurrentApp('tasks');
                    if (app.id === 'calendar') setCurrentApp('calendar');
                    if (app.id === 'mail') setCurrentApp('mail');
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    app.isActive
                      ? 'bg-neutral-100 dark:bg-[#2b2b2b] text-neutral-900 dark:text-neutral-100'
                      : app.isAvailable
                      ? 'hover:bg-neutral-50 dark:hover:bg-[#262626] text-neutral-800 dark:text-neutral-200 cursor-pointer'
                      : 'opacity-55 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {app.icon}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate">{app.name}</span>
                        {app.isActive && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            Activa
                          </span>
                        )}
                        {app.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                              app.badge.toLowerCase() === 'beta'
                                ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            {app.badge.toLowerCase() === 'beta' && (
                              <BetaFlaskIcon className="w-3 h-3" />
                            )}
                            <span>{app.badge}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {app.description}
                      </p>
                    </div>
                  </div>

                  {app.isActive && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>

            {/* Footer link to Welcome Hub */}
            <div className="px-3 py-2.5 bg-neutral-50 dark:bg-[#1a1a1a] border-t border-[#f0f0ee] dark:border-[#2c2c2c] flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setCurrentApp('hub');
                }}
                className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white font-medium cursor-pointer transition-colors"
              >
                <span>← Ir al Hub de Bienvenida</span>
              </button>
              <span className="text-[10px] font-mono text-neutral-400">/</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
