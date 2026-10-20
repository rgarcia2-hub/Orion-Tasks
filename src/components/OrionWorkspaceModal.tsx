import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendar } from '../context/CalendarContext';
import { OrionLogo } from './OrionLogo';
import {
  X,
  CheckCircle2,
  ExternalLink,
  LogOut,
  RefreshCw,
  Sparkles,
  Layers,
  Calendar,
  CalendarDays,
  CheckSquare,
  FileText,
  User,
  Mail,
} from 'lucide-react';

interface OrionWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrionWorkspaceModal: React.FC<OrionWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isGoogleConnected,
    isLoadingGoogle,
    loginWithGoogle,
    logoutGoogle,
    refreshGoogleData,
    isCloudSynced,
    stats,
    events,
    currentApp,
    setCurrentApp,
  } = useCalendar();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1c1c1c] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10"
        >
          {/* Top Brand Banner */}
          <div className="relative px-6 pt-6 pb-5 bg-gradient-to-b from-neutral-50 via-white to-white dark:from-[#242424] dark:via-[#1c1c1c] dark:to-[#1c1c1c] border-b border-neutral-100 dark:border-neutral-800/80">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <OrionLogo size={36} className="w-9 h-9 shadow-md rounded-xl" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                    Orion Workspace
                  </h2>
                  <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/60">
                    Workspace
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Ecosistema de productividad unificado con tu cuenta de Google
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Google Account Profile Card */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/70 dark:border-neutral-800/90">
              {isGoogleConnected && user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Google'}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {user.displayName || 'Usuario de Orion'}
                          </p>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            Conectado
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={logoutGoogle}
                      title="Cerrar sesión de Google"
                      className="shrink-0 p-2 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                      {isCloudSynced ? 'Sincronización activa con Firestore' : 'Conectando a la nube...'}
                    </span>
                    <button
                      onClick={refreshGoogleData}
                      disabled={isLoadingGoogle}
                      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingGoogle ? 'animate-spin' : ''}`} />
                      Sincronizar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      Cuenta de Google no conectada
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Inicia sesión para sincronizar calendarios, tareas y notas en tu cuenta.
                    </p>
                  </div>
                  <button
                    onClick={loginWithGoogle}
                    disabled={isLoadingGoogle}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-900 dark:text-neutral-100 bg-white dark:bg-[#1a1a1a] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Conectar Google</span>
                  </button>
                </div>
              )}
            </div>

            {/* Apps in Orion Workspace */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Aplicaciones de Orion Workspace
                </span>
                <span className="text-[11px] text-neutral-400">2 apps disponibles</span>
              </div>

              {/* Orion Calendar App Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                currentApp === 'calendar'
                  ? 'border-2 border-blue-500/60 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-blue-950/20 dark:via-[#222222] dark:to-indigo-950/10 shadow-xs'
                  : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#232323] hover:border-blue-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          Orion Calendar
                        </h3>
                        {currentApp === 'calendar' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            En uso
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60">
                            /calendar
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        Calendario unificado, vistas de semana, mes y agenda con sincronización en tiempo real.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    {events.length} eventos programados
                  </span>

                  <button
                    onClick={() => {
                      onClose();
                      setCurrentApp('calendar');
                    }}
                    className="px-3 py-1 rounded-md text-xs font-semibold text-blue-700 bg-blue-100/80 hover:bg-blue-200/80 dark:text-blue-300 dark:bg-blue-950/80 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                  >
                    {currentApp === 'calendar' ? 'Volver a la App' : 'Abrir Calendar'}
                  </button>
                </div>
              </div>

              {/* Orion Tasks App Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                currentApp === 'tasks'
                  ? 'border-2 border-indigo-500/60 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-indigo-950/20 dark:via-[#222222] dark:to-purple-950/10 shadow-xs'
                  : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#232323] hover:border-indigo-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shadow-sm shrink-0">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          Orion Tasks
                        </h3>
                        {currentApp === 'tasks' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            En uso
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60">
                            /tasks
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        Gestión inteligente de tareas, tablero Kanban de flujo y notas vinculadas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                    <CheckSquare className="w-3 h-3 text-purple-500" />
                    {stats.pending} tareas pendientes
                  </span>

                  <button
                    onClick={() => {
                      onClose();
                      setCurrentApp('tasks');
                    }}
                    className="px-3 py-1 rounded-md text-xs font-semibold text-indigo-700 bg-indigo-100/80 hover:bg-indigo-200/80 dark:text-indigo-300 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 transition-colors cursor-pointer"
                  >
                    {currentApp === 'tasks' ? 'Volver a la App' : 'Abrir Tasks'}
                  </button>
                </div>
              </div>

              {/* Orion Mail App Card */}
              <div className={`p-4 rounded-xl border transition-all ${
                currentApp === 'mail'
                  ? 'border-2 border-purple-500/60 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 dark:from-purple-950/20 dark:via-[#222222] dark:to-indigo-950/10 shadow-xs'
                  : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#232323] hover:border-purple-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-sm shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          Orion Mail
                        </h3>
                        {currentApp === 'mail' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            En uso
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60">
                            /mail
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        Cliente de correo híbrido de 3 columnas con soporte para Gmail y buzón privado en Firestore.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                    <Mail className="w-3 h-3 text-purple-500" />
                    Bandeja híbrida unificada
                  </span>

                  <button
                    onClick={() => {
                      onClose();
                      setCurrentApp('mail');
                    }}
                    className="px-3 py-1 rounded-md text-xs font-semibold text-purple-700 bg-purple-100/80 hover:bg-purple-200/80 dark:text-purple-300 dark:bg-purple-950/80 dark:hover:bg-purple-900 transition-colors cursor-pointer"
                  >
                    {currentApp === 'mail' ? 'Volver a la App' : 'Abrir Mail'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-neutral-50 dark:bg-[#202020] border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Orion Workspace</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
