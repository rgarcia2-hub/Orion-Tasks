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
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Privacy and security starts here
          </p>
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
