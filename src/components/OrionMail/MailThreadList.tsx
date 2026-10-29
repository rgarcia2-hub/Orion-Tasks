import React, { useState } from 'react';
import { Search, Star, X, Mail, CheckCheck, Crown, Image as ImageIcon, Sparkles, Zap, Calendar } from 'lucide-react';
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
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'starred' | 'actionable'>('all');

  const folderNames: Record<MailFolder, string> = {
    inbox: 'Bandeja de Entrada',
    starred: 'Mensajes Destacados',
    sent: 'Mensajes Enviados',
    drafts: 'Borradores',
    trash: 'Papelera',
  };

  const isActionableEmail = (email: OrionEmail) => {
    const text = `${email.subject} ${email.preview} ${email.body}`.toLowerCase();
    return (
      text.includes('reunión') ||
      text.includes('tarea') ||
      text.includes('urgente') ||
      text.includes('asap') ||
      text.includes('deadline') ||
      text.includes('fecha límite') ||
      text.includes('presentación') ||
      text.includes('entregar') ||
      text.includes('revisar') ||
      text.includes('propuesta') ||
      text.includes('meet')
    );
  };

  // Filter emails based on search and subfilter
  const filteredEmails = emails.filter((email) => {
    // Subfilter
    if (filterMode === 'unread' && email.isRead) return false;
    if (filterMode === 'starred' && !email.isStarred) return false;
    if (filterMode === 'actionable' && !isActionableEmail(email)) return false;

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

        {/* Quick Filter Tabs with AI Actionable Filter */}
        <div className="grid grid-cols-4 gap-0.5 p-0.5 bg-[#efefed] dark:bg-[#222222] rounded-lg text-center">
          <button
            onClick={() => setFilterMode('all')}
            className={`py-1 rounded-md text-[10.5px] font-medium transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-[#2e2e2e] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterMode('unread')}
            className={`py-1 rounded-md text-[10.5px] font-medium transition-all cursor-pointer ${
              filterMode === 'unread'
                ? 'bg-white dark:bg-[#2e2e2e] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            No leídos
          </button>
          <button
            onClick={() => setFilterMode('starred')}
            className={`py-1 rounded-md text-[10.5px] font-medium transition-all cursor-pointer ${
              filterMode === 'starred'
                ? 'bg-white dark:bg-[#2e2e2e] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            Destacados
          </button>
          <button
            onClick={() => setFilterMode('actionable')}
            title="Mostrar correos con tareas o reuniones detectadas"
            className={`py-1 rounded-md text-[10.5px] font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
              filterMode === 'actionable'
                ? 'bg-amber-100/90 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 shadow-2xs font-semibold border border-amber-300/40 shadow-[0_0_10px_rgba(254,240,138,0.3)]'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>Acciones</span>
          </button>
        </div>
      </div>

      {/* List of Messages */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/40">
        {filteredEmails.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-[#222222] flex items-center justify-center text-neutral-400 dark:text-neutral-500">
              <Mail className="w-4 h-4" />
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
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline pt-1 cursor-pointer"
              >
                Redactar un mensaje nuevo
              </button>
            )}
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = selectedEmailId === email.id;
            const actionable = isActionableEmail(email);

            return (
              <div
                key={email.id}
                onClick={() => onSelectEmail(email)}
                className={`px-4 py-3 transition-colors cursor-pointer relative group ${
                  isSelected
                    ? 'bg-neutral-100/90 dark:bg-[#242424]'
                    : 'hover:bg-neutral-50 dark:hover:bg-[#1d1d1d]'
                }`}
              >
                {/* Unread indicator dot */}
                {!email.isRead && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 absolute top-4 left-1.5" />
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
                    {email.source === 'gmail' && (
                      <span className="shrink-0 text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                        · Gmail
                      </span>
                    )}
                    {email.hasImages && (
                      <span title="Contiene imágenes" className="shrink-0 text-neutral-400 dark:text-neutral-500">
                        <ImageIcon className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-mono tabular-nums text-neutral-400 dark:text-neutral-500">
                      {formatDate(email.date)}
                    </span>
                    <button
                      onClick={(e) => onToggleStar(email.id, e)}
                      title={email.isStarred ? 'Quitar de destacados' : 'Destacar'}
                      className="p-1 rounded text-neutral-400 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-600'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Subject with Actionable Badge */}
                <div className="flex items-center justify-between gap-1.5 mt-1">
                  <p
                    className={`text-xs truncate ${
                      !email.isRead
                        ? 'font-semibold text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {email.subject}
                  </p>

                  {actionable && (
                    <span
                      title="Contiene posibles tareas o reuniones extraíbles con IA"
                      className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9.5px] font-medium bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-300/40 shadow-[0_0_8px_rgba(254,240,138,0.25)]"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                      <span>Acción</span>
                    </span>
                  )}
                </div>

                {/* Snippet */}
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
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
