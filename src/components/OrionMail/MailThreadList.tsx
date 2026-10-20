import React, { useState } from 'react';
import { Search, Star, X, Mail, CheckCheck, Crown, Image as ImageIcon } from 'lucide-react';
import { OrionEmail, MailFolder, isOrionAdmin } from '../../types/mail';

interface MailThreadListProps {
  emails: OrionEmail[];
  selectedEmailId: string | null;
  onSelectEmail: (email: OrionEmail) => void;
  onToggleStar: (emailId: string, e: React.MouseEvent) => void;
  folder: MailFolder;
  onOpenCompose: () => void;
  onMarkAllAsRead?: () => void;
}

export const MailThreadList: React.FC<MailThreadListProps> = ({
  emails,
  selectedEmailId,
  onSelectEmail,
  onToggleStar,
  folder,
  onOpenCompose,
  onMarkAllAsRead,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'starred'>('all');

  const folderNames: Record<MailFolder, string> = {
    inbox: 'Bandeja de Entrada',
    starred: 'Mensajes Destacados',
    sent: 'Mensajes Enviados',
    drafts: 'Borradores',
    trash: 'Papelera',
  };

  // Filter emails based on search and subfilter
  const filteredEmails = emails.filter((email) => {
    // Subfilter
    if (filterMode === 'unread' && email.isRead) return false;
    if (filterMode === 'starred' && !email.isStarred) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(q) ||
      email.from.name.toLowerCase().includes(q) ||
      email.from.email.toLowerCase().includes(q) ||
      email.preview.toLowerCase().includes(q) ||
      email.body.toLowerCase().includes(q)
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-80 sm:w-96 h-full shrink-0 border-r border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#181818] flex flex-col justify-between">
      {/* Top Header & Search Area */}
      <div className="p-3.5 border-b border-neutral-200/60 dark:border-neutral-800/60 space-y-3 bg-[#ffffff] dark:bg-[#181818]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {folderNames[folder]}
          </h2>
          <span className="text-[11px] font-semibold tabular-nums text-neutral-400 dark:text-neutral-500">
            {filteredEmails.length} {filteredEmails.length === 1 ? 'mensaje' : 'mensajes'}
          </span>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por asunto, persona o texto..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-neutral-100 dark:bg-[#222222] border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              filterMode === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-[#242424]'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterMode('unread')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              filterMode === 'unread'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-[#242424]'
            }`}
          >
            No leídos
          </button>
          <button
            onClick={() => setFilterMode('starred')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              filterMode === 'starred'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white bg-neutral-100 dark:bg-[#242424]'
            }`}
          >
            Destacados
          </button>
        </div>
      </div>

      {/* List of Messages */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/40">
        {filteredEmails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-[#222222] flex items-center justify-center text-neutral-400 dark:text-neutral-500">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {searchQuery ? 'Sin resultados para la búsqueda' : 'Bandeja vacía'}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                {searchQuery
                  ? 'Intenta con otro término o limpia el buscador.'
                  : 'No hay mensajes en esta carpeta actualmente.'}
              </p>
            </div>
            {!searchQuery && folder === 'inbox' && (
              <button
                onClick={onOpenCompose}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline pt-1"
              >
                Redactar un mensaje nuevo
              </button>
            )}
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`p-3.5 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-l-3 border-l-indigo-600 dark:border-l-indigo-400'
                    : 'hover:bg-neutral-50 dark:hover:bg-[#1f1f1f] border-l-3 border-l-transparent'
                }`}
              >
                {/* Unread indicator dot */}
                {!email.isRead && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute top-4 left-1.5" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-xs truncate ${
                        !email.isRead
                          ? 'font-bold text-neutral-950 dark:text-white'
                          : 'font-medium text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {email.from.name}
                    </span>
                    {(email.isAdminOfficial || isOrionAdmin(email.from.email) || email.from.email.includes('orionworkspace')) && (
                      <span title="Mensaje Oficial del Administrador de Orion">
                        <Crown className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                      </span>
                    )}
                    {email.source === 'gmail' && (
                      <span className="shrink-0 text-[9.5px] font-semibold px-1 py-0.2 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40">
                        Gmail
                      </span>
                    )}
                    {email.hasImages && (
                      <span title="Contiene imágenes" className="shrink-0 text-emerald-600 dark:text-emerald-400">
                        <ImageIcon className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10.5px] tabular-nums text-neutral-400 dark:text-neutral-500">
                      {formatDate(email.date)}
                    </span>
                    <button
                      onClick={(e) => onToggleStar(email.id, e)}
                      title={email.isStarred ? 'Quitar de destacados' : 'Destacar'}
                      className="p-1 rounded text-neutral-400 hover:text-amber-500 transition-colors"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-neutral-400 dark:text-neutral-600'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <p
                  className={`text-xs mt-1 truncate ${
                    !email.isRead
                      ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {email.subject}
                </p>

                {/* Snippet */}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {email.preview}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
