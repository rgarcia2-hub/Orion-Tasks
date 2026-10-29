import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useCalendar } from '../context/CalendarContext';
import { OrionLogo } from './OrionLogo';
import { GoogleAuthButton } from './GoogleAuthButton';
import { BetaFlaskIcon } from './BetaFlaskIcon';
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Mail,
  HardDrive,
  Moon,
  Sun,
  Settings as SettingsIcon,
  X,
  CheckCircle2,
  Cloud,
  LogOut,
  RefreshCw,
  ExternalLink,
  Search,
  Sparkles,
  Flame,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const OrionWorkspaceHub: React.FC = () => {
  const {
    user,
    isGoogleConnected,
    loginWithGoogle,
    logoutGoogle,
    isLoadingGoogle,
    refreshGoogleData,
    isCloudSynced,
    darkMode,
    toggleDarkMode,
    setCurrentApp,
    navigateToApp,
    stats,
    events,
    tasks,
    habits,
    setIsSpotlightOpen,
    setActiveTab,
  } = useCalendar();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const apps = [
    {
      id: 'tasks',
      name: 'Tasks',
      fullName: 'Orion Tasks',
      isAvailable: true,
      badge: null,
      description: 'Calendarios, tablero Kanban de flujo y notas',
      icon: (
        <div className="w-12 h-12 rounded-xl bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 shadow-sm transition-transform duration-200 group-hover:scale-105">
          <CalendarIcon className="w-6 h-6" />
        </div>
      ),
      action: () => setCurrentApp('tasks'),
    },
    {
      id: 'calendar',
      name: 'Calendar',
      fullName: 'Orion Calendar',
      isAvailable: true,
      badge: null,
      description: 'Calendario unificado, vistas de semana, mes y agenda con sincronización Google',
      icon: (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
          <CalendarDays className="w-6 h-6" />
        </div>
      ),
      action: () => setCurrentApp('calendar'),
    },
    {
      id: 'mail',
      name: 'Mail',
      fullName: 'Orion Mail',
      isAvailable: true,
      badge: 'Beta',
      description: 'Cliente de correo híbrido de 3 columnas (Gmail + Cloud Firestore)',
      icon: (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
          <Mail className="w-6 h-6" />
        </div>
      ),
      action: () => setCurrentApp('mail'),
    },
    {
      id: 'drive',
      name: 'Drive',
      fullName: 'Orion Drive',
      isAvailable: false,
      badge: 'Soon',
      description: 'Almacenamiento en la nube y gestión de archivos',
      icon: (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
          <HardDrive className="w-6 h-6" />
        </div>
      ),
      action: () => showToast('Orion Drive estará disponible próximamente en Orion Workspace.'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-neutral-200 dark:selection:bg-neutral-800 transition-colors">
      {/* Top Header (Matching Proton layout with Notion aesthetic) */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full flex items-center justify-between px-6 sm:px-10 py-5"
      >
        {/* Top-left: Orion Logo + "Orion" */}
        <div className="flex items-center gap-2.5">
          <OrionLogo size={32} className="w-8 h-8 rounded-lg shadow-2xs" />
          <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Orion
          </span>
        </div>

        {/* Top-right: User Profile & Theme Toggle */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                  {user.displayName || 'Usuario'}
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono leading-tight">
                  {user.email}
                </span>
              </div>

              {/* Avatar circle (like the "R" circle in Proton's screenshot) */}
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google'}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-700"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center font-bold text-xs ring-1 ring-neutral-300 dark:ring-neutral-700">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
          ) : (
            <GoogleAuthButton compact />
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </motion.header>

      {/* Main Center Area: Welcome & App Squircles Grid */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="text-center mb-12 sm:mb-16 space-y-2"
        >
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Welcome
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-4">
            Privacy and security starts here
          </p>

          {/* Liquid Glass Spotlight Trigger Bar */}
          <button
            onClick={() => setIsSpotlightOpen(true)}
            className="liquid-glass rounded-2xl px-4 py-2.5 max-w-md w-full mx-auto flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300 hover:scale-[1.01] transition-all cursor-pointer shadow-lg group border border-white/40 dark:border-white/10"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-neutral-500 dark:text-neutral-400">Buscar en todo Orion...</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 border border-neutral-300/40 dark:border-neutral-700">⌘K</kbd>
            </div>
          </button>
        </motion.div>

        {/* 4 App Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 items-center justify-center max-w-3xl w-full">
          {apps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 22, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <motion.button
                whileHover={{ y: -5, scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={app.action}
                className="group relative flex flex-col items-center focus:outline-hidden cursor-pointer"
              >
                {/* Large Squircle Icon Container */}
                <div
                  className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl sm:rounded-3xl flex items-center justify-center bg-white dark:bg-[#222222] border border-[#e9e9e7] dark:border-[#2e2e2e] shadow-xs hover:shadow-lg transition-all duration-200 ${
                    app.isAvailable
                      ? 'border-indigo-500/30 dark:border-indigo-500/40 ring-2 ring-transparent group-hover:ring-indigo-500/20 shadow-indigo-500/5'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* App Pill Badge on Top Right (Soon / Beta) */}
                  {app.badge && (
                    <span
                      className={`absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-full flex items-center gap-1 shadow-2xs ${
                        app.badge.toLowerCase() === 'beta'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300/80 dark:border-purple-800'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300/80 dark:border-neutral-700'
                      }`}
                    >
                      {app.badge.toLowerCase() === 'beta' && (
                        <BetaFlaskIcon className="w-3.5 h-3.5" />
                      )}
                      <span>{app.badge}</span>
                    </span>
                  )}

                  {/* App Icon */}
                  {app.icon}
                </div>

                {/* App Name Label */}
                <span className="mt-3 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200 tracking-tight group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                  {app.name}
                </span>

                {/* Status Indicator under Orion Apps */}
                {app.isAvailable && (
                  <span className="mt-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 flex items-center gap-0.5 transition-colors">
                    <span>Abrir /{app.id}</span>
                  </span>
                )}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* "Mi Día" Summary Dashboard Card */}
        {(() => {
          const todayKey = new Date().toISOString().split('T')[0];
          const todayEvents = events.filter((e) => e.startDateTime.startsWith(todayKey));
          const nextEvent = todayEvents.find((e) => new Date(e.startDateTime).getTime() > Date.now()) || todayEvents[0];
          const habitsDoneToday = habits.filter((h) => h.completedDates.includes(todayKey)).length;
          const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak || 0)) : 0;

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 }}
              className="w-full max-w-2xl mt-10 p-5 rounded-3xl bg-white dark:bg-[#1f1f23] border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      Mi Día en Orion
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 capitalize">
                      {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSpotlightOpen(true)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Spotlight</span>
                </button>
              </div>

              {/* 3 Metric Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Events today */}
                <div
                  onClick={() => setCurrentApp('calendar')}
                  className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-neutral-200/60 dark:border-neutral-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                      <span>Agenda Hoy</span>
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {todayEvents.length} {todayEvents.length === 1 ? 'evento' : 'eventos'}
                  </div>
                  <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    {nextEvent ? nextEvent.title : 'Sin eventos programados'}
                  </p>
                </div>

                {/* Pending Tasks */}
                <div
                  onClick={() => setCurrentApp('tasks')}
                  className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-neutral-200/60 dark:border-neutral-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tareas</span>
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    {stats.pending} pendientes
                  </div>
                  <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    {stats.inProgress > 0 ? `${stats.inProgress} en curso` : 'Tablero al día'}
                  </p>
                </div>

                {/* Habits */}
                <div
                  onClick={() => setCurrentApp('tasks')}
                  className="p-3 rounded-2xl bg-neutral-50/80 dark:bg-neutral-800/50 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 border border-neutral-200/60 dark:border-neutral-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Hábitos</span>
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <span>{habitsDoneToday}/{habits.length}</span>
                    {maxStreak > 0 && (
                      <span className="text-xs font-semibold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                        {maxStreak}d
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                    {habitsDoneToday === habits.length && habits.length > 0 ? '¡Racha completa hoy!' : 'Rachas activas'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </main>

      {/* Bottom Center: Settings Button & Legal Links */}
      <motion.footer
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="w-full flex flex-col items-center justify-center pb-8 pt-4 gap-3"
      >
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#242424] hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] border border-neutral-200/90 dark:border-neutral-800 shadow-2xs transition-all hover:shadow-xs cursor-pointer"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span>Configuración</span>
        </button>

        <div className="flex items-center gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
          <button
            onClick={() => navigateToApp('privacy')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 hover:underline transition-colors cursor-pointer"
          >
            Política de Privacidad
          </button>
          <span>•</span>
          <button
            onClick={() => navigateToApp('terms')}
            className="hover:text-neutral-900 dark:hover:text-neutral-200 hover:underline transition-colors cursor-pointer"
          >
            Condiciones de Servicio
          </button>
        </div>
      </motion.footer>

      {/* Toast notification for "Soon" apps */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium shadow-lg flex items-center gap-2 border border-neutral-800 dark:border-neutral-200 max-w-sm text-center"
        >
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Settings Modal (Notion Aesthetic) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsSettingsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-neutral-500" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Configuración de Orion Workspace
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Account Section */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200/80 dark:border-neutral-800 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Cuenta Conectada
                </span>
                {user ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {user.displayName || 'Google User'}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={logoutGoogle}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Sin cuenta vinculada</span>
                    <GoogleAuthButton compact />
                  </div>
                )}
              </div>

              {/* Ecosystem Apps Info */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Aplicaciones de Orion
                </span>
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                  <div className="py-2 flex items-center justify-between">
                    <span className="font-medium">Orion Tasks</span>
                    <span className="text-emerald-600 font-semibold text-[11px]">Disponible</span>
                  </div>
                  <div className="py-2 flex items-center justify-between text-neutral-500">
                    <span>Orion Calendar</span>
                    <span className="text-neutral-400 text-[11px]">Próximamente</span>
                  </div>
                  <div className="py-2 flex items-center justify-between text-neutral-500">
                    <span>Orion Mail</span>
                    <span className="text-neutral-400 text-[11px]">Próximamente</span>
                  </div>
                  <div className="py-2 flex items-center justify-between text-neutral-500">
                    <span>Orion Drive</span>
                    <span className="text-neutral-400 text-[11px]">Próximamente</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-neutral-50 dark:bg-[#252525] border-t border-neutral-100 dark:border-neutral-800 text-right">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 cursor-pointer"
              >
                Listo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
