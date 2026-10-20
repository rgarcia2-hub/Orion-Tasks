import React from 'react';
import { motion } from 'motion/react';
import {
  Inbox,
  Star,
  Send,
  FileText,
  Trash2,
  Plus,
  Mail,
  Layers,
  Tag,
  CheckCircle2,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { MailFolder, MailAccountFilter, isOrionAdmin } from '../../types/mail';
import { useCalendar } from '../../context/CalendarContext';
import { BetaFlaskIcon } from '../BetaFlaskIcon';

interface MailSidebarProps {
  currentFolder: MailFolder;
  onSelectFolder: (folder: MailFolder) => void;
  accountFilter: MailAccountFilter;
  onChangeAccountFilter: (filter: MailAccountFilter) => void;
  unreadCount: number;
  starredCount: number;
  draftsCount: number;
  onOpenCompose: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const MailSidebar: React.FC<MailSidebarProps> = ({
  currentFolder,
  onSelectFolder,
  accountFilter,
  onChangeAccountFilter,
  unreadCount,
  starredCount,
  draftsCount,
  onOpenCompose,
  onRefresh,
  isRefreshing = false,
}) => {
  const { user, isGoogleConnected } = useCalendar();

  const folders: { id: MailFolder; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'inbox', label: 'Recibidos', icon: <Inbox className="w-4 h-4" />, count: unreadCount },
    { id: 'starred', label: 'Destacados', icon: <Star className="w-4 h-4" />, count: starredCount },
    { id: 'sent', label: 'Enviados', icon: <Send className="w-4 h-4" /> },
    { id: 'drafts', label: 'Borradores', icon: <FileText className="w-4 h-4" />, count: draftsCount },
    { id: 'trash', label: 'Papelera', icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 h-full shrink-0 border-r border-neutral-200/80 dark:border-neutral-800/80 bg-[#fbfbfb] dark:bg-[#161616] flex flex-col justify-between select-none">
      <div className="p-3.5 space-y-3.5 overflow-y-auto">
        {/* Account Selector Pill */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Cuentas
            </label>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Sincronizar correos ahora"
              className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-200/60 dark:bg-[#202020] rounded-xl text-xs font-medium">
            <button
              onClick={() => onChangeAccountFilter('all')}
              className={`py-1 rounded-lg text-center transition-all ${
                accountFilter === 'all'
                  ? 'bg-white dark:bg-[#2c2c2c] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => onChangeAccountFilter('gmail')}
              title={isGoogleConnected ? 'Cuenta Gmail conectada' : 'Gmail'}
              className={`py-1 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
                accountFilter === 'gmail'
                  ? 'bg-white dark:bg-[#2c2c2c] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Gmail
              {isGoogleConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
            <button
              onClick={() => onChangeAccountFilter('internal')}
              className={`py-1 rounded-lg text-center transition-all ${
                accountFilter === 'internal'
                  ? 'bg-white dark:bg-[#2c2c2c] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Orion
            </button>
          </div>
        </div>

        {/* Primary Action Button: Compose */}
        <button
          onClick={onOpenCompose}
          className="w-full py-2.5 px-3.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Redactar correo</span>
        </button>

        {/* Folders List */}
        <div className="space-y-0.5 pt-1">
          <div className="flex items-center justify-between px-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span>Carpetas</span>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Sincronizar correos"
              className="hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
            </button>
          </div>
          {folders.map((folder) => {
            const isActive = currentFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-950 dark:text-white font-semibold shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-neutral-400 dark:text-neutral-500'}>
                    {folder.icon}
                  </span>
                  <span>{folder.label}</span>
                </div>
                {typeof folder.count === 'number' && folder.count > 0 && (
                  <span
                    className={`text-[11px] tabular-nums px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Labels / Tags Section */}
        <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 px-2 block pb-1">
            Etiquetas
          </span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 transition-colors">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Orion Workspace</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Google Gmail</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40 transition-colors">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Seguridad</span>
          </div>
        </div>

        {/* Small Orion Mail BETA Card */}
        <div className="pt-2">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/50 flex items-center gap-2.5">
            <BetaFlaskIcon className="w-5 h-5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-neutral-900 dark:text-neutral-100">Orion Mail</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-purple-200/90 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200">
                  BETA
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                Canal preliminar activo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom User Account Status Card */}
      <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/50 dark:bg-[#1a1a1a]/50">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl bg-neutral-100/80 dark:bg-neutral-800/60">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'Avatar'} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'O'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1 truncate">
              <span className="truncate">{user?.displayName || (isOrionAdmin(user?.email) ? 'Robert García' : 'Usuario Orion')}</span>
              {isOrionAdmin(user?.email) && (
                <span title="Administrador de Orion Workspace">
                  <Crown className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                </span>
              )}
            </p>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
              {isOrionAdmin(user?.email) ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">👑 Administrador Oficial</span>
              ) : (
                user?.email || 'Buzón local activo'
              )}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
