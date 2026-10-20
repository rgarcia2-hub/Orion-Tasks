import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OrionLogo } from './OrionLogo';
import { Calendar as CalendarIcon, CalendarDays, Mail, Sparkles } from 'lucide-react';

interface AppTransitionScreenProps {
  isOpen: boolean;
  targetApp: 'hub' | 'tasks' | 'calendar' | 'mail' | 'privacy' | 'terms' | null;
  progress?: number;
}

export const AppTransitionScreen: React.FC<AppTransitionScreenProps> = ({
  isOpen,
  targetApp,
  progress = 0,
}) => {
  const isTasks = targetApp === 'tasks';
  const isCalendar = targetApp === 'calendar';
  const isMail = targetApp === 'mail';

  const getSubtext = () => {
    if (isMail) {
      if (progress < 40) return 'Conectando con bandejas de correo y Gmail...';
      if (progress < 80) return 'Sincronizando mensajes y borradores de Firestore...';
      return 'Abriendo Orion Mail...';
    }
    if (isCalendar) {
      if (progress < 40) return 'Conectando con Google Calendar y Orion...';
      if (progress < 80) return 'Sincronizando vistas de semana, mes y eventos...';
      return 'Abriendo tu calendario unificado...';
    }
    if (isTasks) {
      if (progress < 40) return 'Conectando con Orion Workspace...';
      if (progress < 80) return 'Sincronizando tareas, notas y calendarios...';
      return 'Abriendo tu espacio de trabajo...';
    }
    if (progress < 50) return 'Guardando estado en Orion Workspace...';
    return 'Cargando el selector de aplicaciones...';
  };

  const getSubUrl = () => {
    if (isMail) return '/mail';
    if (isCalendar) return '/calendar';
    if (isTasks) return '/tasks';
    return '/';
  };

  const getTitle = () => {
    if (isMail) return 'Abriendo Orion Mail';
    if (isCalendar) return 'Abriendo Orion Calendar';
    if (isTasks) return 'Abriendo Orion Tasks';
    return 'Orion Workspace';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="app-transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.28, ease: 'easeInOut' } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fbfbfa]/95 dark:bg-[#191919]/95 backdrop-blur-xl select-none"
        >
          {/* Ambient Cosmic Radial Glow */}
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 blur-3xl pointer-events-none -z-0"
          />

          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm">
            {/* Animated Logo / Icon Squircle */}
            <div className="relative mb-6">
              {/* Subtle spinning orbital ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-3 rounded-3xl border border-dashed border-indigo-400/40 dark:border-indigo-400/30"
              />

              {isMail ? (
                <motion.div
                  initial={{ scale: 0.8, rotate: -4 }}
                  animate={{ scale: [0.95, 1.05, 1], rotate: [0, 2, 0] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-xl ring-4 ring-purple-500/20"
                >
                  <Mail className="w-9 h-9" />
                </motion.div>
              ) : isCalendar ? (
                <motion.div
                  initial={{ scale: 0.8, rotate: -4 }}
                  animate={{ scale: [0.95, 1.05, 1], rotate: [0, 2, 0] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl ring-4 ring-blue-500/20"
                >
                  <CalendarDays className="w-9 h-9" />
                </motion.div>
              ) : isTasks ? (
                <motion.div
                  initial={{ scale: 0.8, rotate: -4 }}
                  animate={{ scale: [0.95, 1.05, 1], rotate: [0, 2, 0] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 shadow-xl ring-4 ring-indigo-500/20"
                >
                  <CalendarIcon className="w-9 h-9" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [0.95, 1.05, 1] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-[#222222] border border-[#e9e9e7] dark:border-[#2e2e2e] flex items-center justify-center shadow-xl ring-4 ring-indigo-500/20"
                >
                  <OrionLogo size={42} className="w-10 h-10" />
                </motion.div>
              )}

              {/* Sparkle badge */}
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md text-[10px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </motion.div>
            </div>

            {/* App / Hub Title */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="space-y-1.5 mb-5"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Orion Workspace
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  {getSubUrl()}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                {getTitle()}
              </h2>
              <motion.p
                key={getSubtext()}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-neutral-500 dark:text-neutral-400 font-medium"
              >
                {getSubtext()}
              </motion.p>
            </motion.div>

            {/* Notion-Style Precision Progress Bar */}
            <div className="w-48 sm:w-56 space-y-2">
              <div className="w-full h-1.5 bg-neutral-200/80 dark:bg-neutral-800 rounded-full overflow-hidden p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full shadow-xs"
                  initial={{ width: '10%' }}
                  animate={{ width: `${Math.max(10, Math.min(100, progress))}%` }}
                  transition={{ ease: 'easeOut', duration: 0.25 }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                <span>Cargando</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
