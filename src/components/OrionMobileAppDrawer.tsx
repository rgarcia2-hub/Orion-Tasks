import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  LayoutGrid,
  CheckSquare,
  CalendarDays,
  Mail,
  HardDrive,
  Shield,
  Search,
  Moon,
  Sun,
  User,
  ExternalLink,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useCalendar } from '../context/CalendarContext';

interface OrionMobileAppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrionMobileAppDrawer: React.FC<OrionMobileAppDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentApp,
    setCurrentApp,
    darkMode,
    toggleDarkMode,
    user,
    loginWithGoogle,
    logoutGoogle,
    setIsSpotlightOpen,
  } = useCalendar();

  if (!isOpen) return null;

  const apps = [
    {
      id: 'hub' as const,
      name: 'Orion Hub',
      description: 'Panel central de productividad',
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
          <LayoutGrid className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'tasks' as const,
      name: 'Orion Tasks',
      description: 'Tablero Kanban y hábitos diarios',
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center shadow-md">
          <CheckSquare className="w-5 h-5 text-indigo-400" />
        </div>
      ),
    },
    {
      id: 'calendar' as const,
      name: 'Orion Calendar',
      description: 'Calendario unificado y agenda',
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
          <CalendarDays className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'mail' as const,
      name: 'Orion Mail',
      description: 'Correo con análisis cognitivo IA',
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md">
          <Mail className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'drive' as const,
      name: 'Orion Drive',
      description: 'Nube y gestión de archivos',
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-md">
          <HardDrive className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'authenticator' as const,
      name: 'Authenticator',
      description: 'Bóveda 2FA protegida con PIN y Passkey',
      badge: '2FA',
      icon: (
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
          <Shield className="w-5 h-5" />
        </div>
      ),
    },
  ];

  const handleSelectApp = (appId: typeof currentApp) => {
    setCurrentApp(appId);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Bottom Sheet Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative z-10 w-full rounded-t-3xl bg-[#141418] border-t border-white/10 p-5 pb-8 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Grab Handle */}
          <div className="w-10 h-1.5 rounded-full bg-neutral-600 mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                Orion Workspace
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30">
                Móvil
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white bg-white/5 active:scale-95 transition-transform"
              aria-label="Cerrar panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsSpotlightOpen(true);
              }}
              className="p-2.5 rounded-xl bg-white/5 active:bg-white/10 border border-white/5 flex items-center gap-2 text-xs text-neutral-200"
            >
              <Search className="w-4 h-4 text-violet-400" />
              <span className="font-medium">Búsqueda Spotlight</span>
            </button>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-white/5 active:bg-white/10 border border-white/5 flex items-center justify-between text-xs text-neutral-200"
            >
              <div className="flex items-center gap-2">
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-400" />
                )}
                <span className="font-medium">
                  {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
              </div>
            </button>
          </div>

          {/* Apps Grid */}
          <div className="overflow-y-auto space-y-1.5 pr-1">
            {apps.map((app) => {
              const isActive = currentApp === app.id;
              return (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => handleSelectApp(app.id)}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3.5 transition-all text-left ${
                    isActive
                      ? 'bg-violet-600/20 border border-violet-500/40 text-white'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] active:bg-white/[0.08] border border-white/5 text-neutral-200'
                  }`}
                >
                  {app.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{app.name}</span>
                      {app.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          {app.badge}
                        </span>
                      )}
                      {isActive && (
                        <span className="ml-auto text-[11px] text-violet-400 font-medium">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {app.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* User Status / Account Footer */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 truncate min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-7 h-7 rounded-full border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                      {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="truncate flex flex-col text-left">
                    <span className="text-neutral-200 truncate font-semibold text-xs">
                      {user.displayName || 'Usuario Orion'}
                    </span>
                    <span className="text-neutral-400 truncate font-mono text-[10px]">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    logoutGoogle();
                    onClose();
                  }}
                  title="Cerrar sesión"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 active:scale-95 transition-all shrink-0 ml-2"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  loginWithGoogle();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-violet-600 active:bg-violet-500 text-white font-semibold text-xs text-center"
              >
                Iniciar sesión con Google
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
