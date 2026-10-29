import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendar } from '../context/CalendarContext';
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Calendar as CalendarIcon,
  CheckSquare,
  Mail,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  ExternalLink,
  X,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { formatEventShortTime } from '../utils/calendarData';

export const OrionNotificationCenter: React.FC = () => {
  const {
    notificationSettings,
    updateNotificationSettings,
    notifications,
    unreadNotificationCount,
    desktopPermission,
    requestDesktopPermission,
    markAllNotificationsAsRead,
    clearNotifications,
    deleteNotification,
    triggerTestNotification,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    setSelectedEventForDetail,
    setSelectedTaskForDetail,
    events,
    tasks,
    setCurrentApp,
    setActiveTab,
  } = useCalendar();

  const [activeTab, setNotificationTab] = useState<'inbox' | 'settings'>('inbox');

  const formatTimeAgo = (isoDate: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Ahora mismo';
      if (diffMin < 60) return `Hace ${diffMin} min`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays} d`;
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (notif: typeof notifications[0]) => {
    if (notif.type === 'event' && notif.targetId) {
      const evt = events.find((e) => e.id === notif.targetId);
      if (evt) {
        setCurrentApp('calendar');
        setSelectedEventForDetail(evt);
        setIsNotificationCenterOpen(false);
        return;
      }
    }
    if (notif.type === 'task' && notif.targetId) {
      const task = tasks.find((t) => t.id === notif.targetId);
      if (task) {
        setCurrentApp('tasks');
        setActiveTab('tasks');
        setSelectedTaskForDetail(task);
        setIsNotificationCenterOpen(false);
        return;
      }
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)}
        title="Centro de notificaciones y avisos de escritorio"
        className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
          isNotificationCenterOpen
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
            : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
        }`}
      >
        {desktopPermission === 'granted' ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
        )}

        {unreadNotificationCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold font-mono flex items-center justify-center shadow-xs animate-pulse">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Slide-over / Dropdown Notification Drawer */}
      <AnimatePresence>
        {isNotificationCenterOpen && (
          <>
            {/* Backdrop for closing */}
            <div
              className="fixed inset-0 z-40 bg-black/10 dark:bg-black/30 backdrop-blur-2xs"
              onClick={() => setIsNotificationCenterOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[85vh] bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <BellRing className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <span>Notificaciones</span>
                      {unreadNotificationCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                          {unreadNotificationCount} nuevas
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNotificationTab(activeTab === 'inbox' ? 'settings' : 'inbox')}
                    className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                    title="Ajustes de notificaciones"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setIsNotificationCenterOpen(false)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Permission Banner */}
              <div className="px-3.5 py-2.5 bg-neutral-50/80 dark:bg-[#1a1a1a]/80 border-b border-neutral-100 dark:border-neutral-800 text-xs">
                {desktopPermission === 'granted' ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Avisos de escritorio activos</span>
                    </div>
                    <button
                      onClick={triggerTestNotification}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      Probar
                    </button>
                  </div>
                ) : desktopPermission === 'denied' ? (
                  <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold leading-tight">Permiso denegado en el navegador</p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Habilítalas haciendo clic en el candado de la barra de direcciones.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-neutral-600 dark:text-neutral-300">
                      <span>Recibe alertas de tus eventos</span>
                    </div>
                    <button
                      onClick={requestDesktopPermission}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <BellRing className="w-3 h-3" />
                      <span>Activar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Main Tab Content */}
              {activeTab === 'settings' ? (
                /* Settings View */
                <div className="p-3.5 space-y-3.5 overflow-y-auto text-xs">
                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
                      Preferencias de Avisos
                    </h4>

                    <div className="space-y-2.5">
                      <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            Activar notificaciones
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.enabled}
                          onChange={(e) => updateNotificationSettings({ enabled: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          {notificationSettings.soundEnabled ? (
                            <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                          )}
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            Sonido agradable (chime)
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.soundEnabled}
                          onChange={(e) => updateNotificationSettings({ soundEnabled: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Antelación de aviso</span>
                          </span>
                          <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            {notificationSettings.leadTimeMinutes} min antes
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 pt-1">
                          {[5, 10, 15, 30].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => updateNotificationSettings({ leadTimeMinutes: mins })}
                              className={`py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer border ${
                                notificationSettings.leadTimeMinutes === mins
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                  : 'bg-white dark:bg-[#2a2a2a] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                        </div>
                      </div>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            Avisos de eventos
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.notifyEvents}
                          onChange={(e) => updateNotificationSettings({ notifyEvents: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            Avisos de tareas del día
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.notifyTasks}
                          onChange={(e) => updateNotificationSettings({ notifyTasks: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={triggerTestNotification}
                        className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 dark:text-amber-600" />
                        <span>Enviar notificación de prueba</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Inbox View */
                <div className="flex-1 overflow-y-auto max-h-[380px] p-2 space-y-1.5 divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => {
                      return (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer group flex items-start gap-2.5 ${
                            notif.read
                              ? 'bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800/40 opacity-75'
                              : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === 'event' ? (
                              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center">
                                <CalendarIcon className="w-3 h-3" />
                              </div>
                            ) : notif.type === 'task' ? (
                              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                                <CheckSquare className="w-3 h-3" />
                              </div>
                            ) : notif.type === 'mail' ? (
                              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center">
                                <Mail className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                                <Sparkles className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {notif.title}
                              </h4>
                              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono shrink-0">
                                {formatTimeAgo(notif.timestamp)}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-0.5">
                              {notif.body}
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 transition-opacity cursor-pointer shrink-0"
                            title="Eliminar aviso"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-10 px-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center mx-auto mb-2">
                        <CheckCheck className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        Todo al día
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-[220px] mx-auto">
                        No tienes alertas pendientes. Recibirás avisos de escritorio cuando se acerquen tus reuniones.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="p-2.5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#1a1a1a]/50 flex items-center justify-between text-xs text-neutral-500">
                {notifications.length > 0 && activeTab === 'inbox' ? (
                  <>
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 font-medium"
                    >
                      <Check className="w-3 h-3" />
                      <span>Marcar todas como leídas</span>
                    </button>
                    <button
                      onClick={clearNotifications}
                      className="text-[11px] text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      Vaciar
                    </button>
                  </>
                ) : (
                  <span className="text-[11px] text-neutral-400">
                    Orion Notification Engine v1.0
                  </span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
