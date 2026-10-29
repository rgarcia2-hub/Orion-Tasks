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
  Sparkles,
  Loader2,
  CalendarCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { OrionEmail, isOrionAdmin } from '../../types/mail';
import { EmailBodyRenderer } from './EmailBodyRenderer';
import { EmailTaskPreviewModal, EmailTaskData } from './EmailTaskPreviewModal';

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
  const [isAnalyzingEmail, setIsAnalyzingEmail] = useState(false);
  const [previewTaskData, setPreviewTaskData] = useState<EmailTaskData | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [cachedAnalysis, setCachedAnalysis] = useState<Record<string, EmailTaskData>>({});
  const [isCopiedSummary, setIsCopiedSummary] = useState(false);

  // Active email analysis if already scanned
  const currentAnalysis = email ? cachedAnalysis[email.id] : null;

  const handleScanEmailWithAI = async (openModalDirectly = true, forceType?: 'task' | 'event') => {
    if (!email || isAnalyzingEmail) return;

    // If already analyzed for this email, open modal right away
    if (currentAnalysis && openModalDirectly) {
      const dataToOpen = { ...currentAnalysis };
      if (forceType === 'event' && !dataToOpen.suggestedEvent) {
        dataToOpen.suggestedEvent = {
          title: `Reunión: ${email.subject}`,
          date: new Date().toISOString().split('T')[0],
          startTime: '10:00',
          durationMinutes: 45,
          location: 'Google Meet',
        };
      }
      setPreviewTaskData(dataToOpen);
      setIsPreviewModalOpen(true);
      return;
    }

    setIsAnalyzingEmail(true);
    try {
      const res = await fetch('/api/gemini/parse-email-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: email.subject,
          bodyText: email.body || '',
          sender: `${email.from.name} <${email.from.email}>`,
          date: email.date,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const parsed: EmailTaskData = {
          title: data.data.title,
          description: data.data.description,
          priority: data.data.priority || 'medium',
          dueDate: data.data.dueDate || new Date().toISOString().split('T')[0],
          category: data.data.category || 'Correo',
          subtasks: data.data.subtasks || [],
          emailSubject: email.subject,
          sender: email.from.name,
          summary: data.data.summary,
          intent: data.data.intent,
          suggestedEvent: data.data.suggestedEvent,
          smartReplies: data.data.smartReplies,
          keyDates: data.data.keyDates,
        };

        setCachedAnalysis((prev) => ({ ...prev, [email.id]: parsed }));

        if (openModalDirectly) {
          setPreviewTaskData(parsed);
          setIsPreviewModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Error parse-email-task:', err);
    } finally {
      setIsAnalyzingEmail(false);
    }
  };

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

  const handleCopySummary = () => {
    if (!currentAnalysis?.summary) return;
    navigator.clipboard.writeText(currentAnalysis.summary);
    setIsCopiedSummary(true);
    setTimeout(() => setIsCopiedSummary(false), 2000);
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

  // Default suggested smart replies if not yet analyzed
  const suggestedReplies = currentAnalysis?.smartReplies || [
    `Hola ${email.from.name.split(' ')[0] || ''}, recibido con éxito. Lo reviso de inmediato y te confirmo.`,
    `¡Hola! Estoy de acuerdo con lo planteado. Procedamos con los siguientes pasos.`,
    `Gracias por el correo. ¿Te parece bien agendar una breve reunión para coordinarlo?`,
  ];

  return (
    <div
      className={`flex-1 h-full bg-[#fafafa] dark:bg-[#141414] flex flex-col justify-between overflow-hidden transition-all duration-300 relative ${
        isAnalyzingEmail
          ? 'ai-contour-glow ring-2 ring-amber-300/80 dark:ring-amber-200/70 z-20'
          : ''
      }`}
    >
      {/* Top Action Toolbar */}
      <div className="h-14 px-6 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-[#181818] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleStar(email.id)}
            title={email.isStarred ? 'Quitar estrella' : 'Destacar'}
            className="p-2 rounded-lg text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Star
              className={`w-4 h-4 ${email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-neutral-500'}`}
            />
          </button>
          <button
            onClick={() => onToggleRead(email.id)}
            title={email.isRead ? 'Marcar como no leído' : 'Marcar como leído'}
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {email.isRead ? <Mail className="w-4 h-4" /> : <MailCheck className="w-4 h-4 text-indigo-500" />}
          </button>
          <button
            onClick={() => onDeleteEmail(email.id)}
            title="Mover a papelera o eliminar"
            className="p-2 rounded-lg text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* AI Action Cluster with Warm Yellowish-White AI Glow */}
        <div className="flex items-center gap-2">
          {/* Quick Schedule Button */}
          <button
            onClick={() => handleScanEmailWithAI(true, 'event')}
            disabled={isAnalyzingEmail}
            title="Escanear y agendar reunión en el Calendario"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>Agendar Evento</span>
          </button>

          {/* Primary AI Scan Button with Yellowish-White Starlight Contour & Glowing Letters */}
          <button
            onClick={() => handleScanEmailWithAI(true)}
            disabled={isAnalyzingEmail}
            title="Escanear correo con IA y extraer tareas o eventos"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-60 ${
              isAnalyzingEmail
                ? 'bg-amber-950/80 text-amber-100 border border-amber-300/90 shadow-[0_0_24px_rgba(254,240,138,0.7),inset_0_0_10px_rgba(254,240,138,0.3)] ai-starlight-pulse'
                : 'text-amber-950 dark:text-amber-100 bg-gradient-to-r from-amber-50 to-amber-100/80 dark:from-neutral-900 dark:to-amber-950/40 border border-amber-300/60 dark:border-amber-400/40 hover:shadow-[0_0_18px_rgba(254,240,138,0.45)] hover:border-amber-300'
            }`}
          >
            <Sparkles
              className={`w-3.5 h-3.5 transition-transform ${
                isAnalyzingEmail
                  ? 'animate-spin text-amber-300 drop-shadow-[0_0_8px_rgba(254,240,138,0.9)]'
                  : 'text-amber-500 dark:text-amber-300 drop-shadow-[0_0_6px_rgba(254,240,138,0.7)]'
              }`}
            />
            <span className={isAnalyzingEmail ? 'ai-letters-glow' : ''}>
              {isAnalyzingEmail ? 'Escaneando con IA...' : 'Escanear con IA'}
            </span>
          </button>

          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono ml-1">
            {email.source === 'gmail' ? 'Gmail' : 'Orion'}
          </span>
        </div>
      </div>

      {/* Main Reading View Content */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 relative">
        {/* Subject & Metadata with Radiant Letters Glow */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1
              className={`text-xl sm:text-2xl font-semibold tracking-tight transition-all duration-300 ${
                isAnalyzingEmail
                  ? 'ai-letters-glow text-amber-950 dark:text-amber-100'
                  : 'text-neutral-950 dark:text-white'
              }`}
            >
              {email.subject}
            </h1>

            {/* AI Intent Badge if available */}
            {currentAnalysis?.intent && (
              <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-200 border border-amber-300/40 dark:border-amber-400/30 shadow-[0_0_12px_rgba(254,240,138,0.3)]">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="capitalize">
                  {currentAnalysis.intent === 'meeting'
                    ? 'Reunión detectada'
                    : currentAnalysis.intent === 'urgent'
                    ? 'Prioridad alta'
                    : currentAnalysis.intent === 'action_required'
                    ? 'Acción requerida'
                    : 'Informativo'}
                </span>
              </span>
            )}
          </div>

          {/* Sender & Recipient Bar */}
          <div className="mt-4 flex items-start justify-between gap-4 pb-5 border-b border-neutral-200/80 dark:border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-semibold text-xs flex items-center justify-center shrink-0 ring-1 ring-neutral-300 dark:ring-neutral-700">
                {email.from.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {email.from.name}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    &lt;{email.from.email}&gt;
                  </span>
                  {(email.isAdminOfficial || isOrionAdmin(email.from.email) || email.from.email.includes('orionworkspace')) && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                      <Crown className="w-3 h-3 text-neutral-600 dark:text-neutral-400 shrink-0" />
                      <span>Admin</span>
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

        {/* AI Scanning Active HUD Banner with Starlight Contour & Glowing Letters */}
        {isAnalyzingEmail && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-400/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shadow-[0_0_24px_rgba(254,240,138,0.45),inset_0_0_12px_rgba(254,240,138,0.15)] ring-1 ring-amber-300/60">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 animate-spin text-amber-500 dark:text-amber-300 drop-shadow-[0_0_8px_rgba(254,240,138,0.85)]" />
              <div>
                <span className="font-semibold ai-letters-glow block">
                  Escaneando correspondencia con IA...
                </span>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 ai-letters-glow">
                  Detectando tareas accionables, fechas límites y solicitudes de reunión
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-300 font-bold ai-letters-glow">
              <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping shadow-[0_0_8px_rgba(254,240,138,1)]" />
              <span>Orion AI</span>
            </div>
          </div>
        )}

        {/* AI Intelligence Card (if already analyzed) */}
        {currentAnalysis && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 dark:from-[#1b1a14] dark:via-[#161618] dark:to-[#1a1914] border border-amber-200/80 dark:border-amber-400/30 shadow-[0_0_20px_rgba(254,240,138,0.2)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500/10 dark:bg-amber-400/20 flex items-center justify-center text-amber-600 dark:text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Inteligencia Orion extraída
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentAnalysis.summary && (
                  <button
                    onClick={handleCopySummary}
                    title="Copiar resumen al portapapeles"
                    className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    {isCopiedSummary ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setPreviewTaskData(currentAnalysis);
                    setIsPreviewModalOpen(true);
                  }}
                  className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline cursor-pointer"
                >
                  Abrir editor
                </button>
              </div>
            </div>

            {currentAnalysis.summary && (
              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {currentAnalysis.summary}
              </p>
            )}

            {currentAnalysis.subtasks && currentAnalysis.subtasks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {currentAnalysis.subtasks.slice(0, 3).map((st, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                  >
                    <CheckCircle2 className="w-3 h-3 text-neutral-400" />
                    <span className="truncate max-w-[200px]">{st}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Body with Glowing Letters during AI analysis */}
        <div className={`relative transition-all duration-300 ${isAnalyzingEmail ? 'ai-reading-letters-glow' : ''}`}>
          <EmailBodyRenderer
            body={email.body}
            bodyHtml={email.bodyHtml}
            subject={email.subject}
          />
        </div>

        {/* Inline Quick Reply Box with AI Smart Suggestions */}
        <div className="pt-4 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <Reply className="w-3.5 h-3.5 text-neutral-500" />
              <span>Respuesta rápida</span>
            </div>

            <span className="text-[11px] text-neutral-400">
              Sugerencias con IA abajo
            </span>
          </div>

          {/* AI Smart Reply Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {suggestedReplies.map((replyChip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInlineReplyText(replyChip)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800/70 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/70 dark:border-neutral-700/60 transition-colors cursor-pointer text-left truncate max-w-xs"
                title={replyChip}
              >
                <span className="text-amber-500 dark:text-amber-400 mr-1">✦</span>
                <span className="truncate">{replyChip}</span>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
            <textarea
              value={inlineReplyText}
              onChange={(e) => setInlineReplyText(e.target.value)}
              placeholder={`Escribe una respuesta para ${email.from.name}...`}
              rows={3}
              className="w-full text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 bg-transparent focus:outline-none resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] text-neutral-400">
                Se enviará a {email.from.email}
              </span>
              <button
                onClick={handleSendReply}
                disabled={!inlineReplyText.trim() || isSendingReply}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-40 text-white transition-colors cursor-pointer shadow-2xs"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingReply ? 'Enviando...' : 'Responder'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <EmailTaskPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        initialData={previewTaskData}
      />
    </div>
  );
};
