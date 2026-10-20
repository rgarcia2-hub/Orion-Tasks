import React, { useState } from 'react';
import {
  Reply,
  Forward,
  Trash2,
  Star,
  Mail,
  MailCheck,
  Send,
  MoreVertical,
  Paperclip,
  CheckCircle2,
  Calendar,
  Crown,
  ShieldCheck,
} from 'lucide-react';
import { OrionEmail, isOrionAdmin } from '../../types/mail';
import { EmailBodyRenderer } from './EmailBodyRenderer';

interface MailReaderViewProps {
  email: OrionEmail | null;
  onToggleStar: (emailId: string) => void;
  onToggleRead: (emailId: string) => void;
  onDeleteEmail: (emailId: string) => void;
  onReply: (email: OrionEmail, replyText: string) => void;
}

export const MailReaderView: React.FC<MailReaderViewProps> = ({
  email,
  onToggleStar,
  onToggleRead,
  onDeleteEmail,
  onReply,
}) => {
  const [inlineReplyText, setInlineReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  if (!email) {
    return (
      <div className="flex-1 h-full bg-[#fafafa] dark:bg-[#141414] flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-neutral-200/50 dark:bg-[#202020] flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4 border border-neutral-200/60 dark:border-neutral-800">
          <Mail className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
          Ningún mensaje seleccionado
        </h3>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mt-1 leading-relaxed">
          Selecciona un correo en la columna de la izquierda para ver su contenido, responder o archivar.
        </p>
      </div>
    );
  }

  const handleSendReply = () => {
    if (!inlineReplyText.trim()) return;
    setIsSendingReply(true);
    setTimeout(() => {
      onReply(email, inlineReplyText);
      setInlineReplyText('');
      setIsSendingReply(false);
    }, 400);
  };

  const formattedFullDate = (() => {
    try {
      return new Date(email.date).toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return email.date;
    }
  })();

  return (
    <div className="flex-1 h-full bg-[#fafafa] dark:bg-[#141414] flex flex-col justify-between overflow-hidden">
      {/* Top Action Toolbar */}
      <div className="h-14 px-6 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#181818] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleStar(email.id)}
            title={email.isStarred ? 'Quitar estrella' : 'Destacar'}
            className="p-2 rounded-lg text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Star
              className={`w-4 h-4 ${email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-neutral-500'}`}
            />
          </button>
          <button
            onClick={() => onToggleRead(email.id)}
            title={email.isRead ? 'Marcar como no leído' : 'Marcar como leído'}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {email.isRead ? <Mail className="w-4 h-4" /> : <MailCheck className="w-4 h-4 text-indigo-500" />}
          </button>
          <button
            onClick={() => onDeleteEmail(email.id)}
            title="Mover a papelera o eliminar"
            className="p-2 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {email.source === 'gmail' ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
              Sincronizado con Gmail
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
              Buzón Orion Cloud
            </span>
          )}
        </div>
      </div>

      {/* Main Reading View Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
        {/* Subject & Metadata */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-950 dark:text-white tracking-tight">
            {email.subject}
          </h1>

          {/* Sender & Recipient Bar */}
          <div className="mt-4 flex items-start justify-between gap-4 pb-5 border-b border-neutral-200/80 dark:border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {email.from.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {email.from.name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    &lt;{email.from.email}&gt;
                  </span>
                  {(email.isAdminOfficial || isOrionAdmin(email.from.email) || email.from.email.includes('orionworkspace')) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-2xs">
                      <Crown className="w-3 h-3 fill-amber-500 text-amber-600 shrink-0" />
                      <span>Admin Oficial Orion</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Para: {email.to.join(', ')}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums capitalize">
                {formattedFullDate}
              </span>
            </div>
          </div>
        </div>

        {/* Rich Message Body (HTML & Markdown with Images and Styles) */}
        <EmailBodyRenderer
          body={email.body}
          bodyHtml={email.bodyHtml}
          subject={email.subject}
        />

        {/* Inline Quick Reply Box */}
        <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <Reply className="w-3.5 h-3.5 text-indigo-500" />
            <span>Respuesta rápida</span>
          </div>

          <div className="bg-white dark:bg-[#181818] rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 shadow-2xs space-y-2">
            <textarea
              value={inlineReplyText}
              onChange={(e) => setInlineReplyText(e.target.value)}
              placeholder={`Escribe una respuesta para ${email.from.name}...`}
              rows={3}
              className="w-full text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 bg-transparent focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/60">
              <span className="text-[10.5px] text-neutral-400">
                Se enviará como respuesta al remitente
              </span>
              <button
                onClick={handleSendReply}
                disabled={!inlineReplyText.trim() || isSendingReply}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingReply ? 'Enviando...' : 'Enviar respuesta'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
