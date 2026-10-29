import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Send,
  Bold,
  Italic,
  Strikethrough,
  List,
  Code,
  Save,
  Crown,
  Sparkles,
  AlertCircle,
  LogIn,
  Image as ImageIcon,
  Link as LinkIcon,
  Quote,
  Heading,
  Eye,
  Edit3,
} from 'lucide-react';
import { ComposeEmailData, isOrionAdmin, ORION_ADMIN_EMAIL } from '../../types/mail';
import { useCalendar } from '../../context/CalendarContext';
import { EmailBodyRenderer } from './EmailBodyRenderer';

interface MailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: ComposeEmailData) => void;
  onSaveDraft: (data: ComposeEmailData) => void;
  isSending?: boolean;
}

export const MailComposeModal: React.FC<MailComposeModalProps> = ({
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  isSending = false,
}) => {
  const { user, isGoogleConnected, loginWithGoogle } = useCalendar();

  const isAdmin = isOrionAdmin(user?.email);

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendAccount, setSendAccount] = useState<'orion' | 'gmail'>('orion');
  const [asAdminOfficial, setAsAdminOfficial] = useState<boolean>(isAdmin);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [composeTab, setComposeTab] = useState<'write' | 'preview'>('write');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customImageAlt, setCustomImageAlt] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleToggleBroadcast = () => {
    if (!isBroadcast) {
      setIsBroadcast(true);
      setTo('todos@orion.app');
      setSubject((prev) => (prev.startsWith('[Oficial] ') ? prev : `[Oficial] ${prev}`));
    } else {
      setIsBroadcast(false);
      setTo('');
      setSubject((prev) => prev.replace(/^\[Oficial\]\s*/, ''));
    }
  };

  // Helper to wrap selected text or insert markdown tokens
  const applyFormat = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => prev + prefix + defaultPlaceholder + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);

    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultPlaceholder}${suffix}`;

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + replacement.length
        : start + prefix.length + defaultPlaceholder.length;
      textarea.setSelectionRange(
        selectedText ? newCursorPos : start + prefix.length,
        newCursorPos
      );
    }, 10);
  };

  const handleInsertImage = () => {
    const url = customImageUrl.trim();
    const alt = customImageAlt.trim() || 'Imagen adjunta';
    if (url) {
      applyFormat(`![${alt}](${url})\n`, '', '');
      setCustomImageUrl('');
      setCustomImageAlt('');
      setShowImagePrompt(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!to.trim() || !subject.trim()) return;

    onSend({
      to: to.trim(),
      subject: subject.trim(),
      body: body.trim(),
      sendAccount,
      asAdminOfficial: isAdmin ? asAdminOfficial : false,
    });

    // Reset fields
    setTo('');
    setSubject('');
    setBody('');
    setIsBroadcast(false);
    onClose();
  };

  const handleSaveDraft = () => {
    if (!to.trim() && !subject.trim() && !body.trim()) return;
    onSaveDraft({
      to: to.trim(),
      subject: subject.trim() || '(Borrador sin asunto)',
      body: body.trim(),
      sendAccount,
      asAdminOfficial: isAdmin ? asAdminOfficial : false,
      isDraft: true,
    });
    setTo('');
    setSubject('');
    setBody('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full sm:max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-t-2xl sm:rounded-2xl shadow-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="h-12 px-4 bg-neutral-100/70 dark:bg-[#222222] border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Redactar mensaje · Orion Mail
            </span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-200/80 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300/80 dark:border-neutral-700">
                <Crown className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                <span>Admin</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleSaveDraft}
              title="Guardar borrador"
              type="button"
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Cerrar"
              type="button"
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-hidden">
          {/* Sender & Account Bar */}
          <div className="px-4 py-2.5 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/70 dark:bg-[#181818]/70 space-y-2">
            {/* Sender selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-neutral-400 font-medium shrink-0">Remitente:</span>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAsAdminOfficial(true)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        asAdminOfficial
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      <Crown className="w-3 h-3 fill-current" />
                      <span>👑 Orion Workspace Oficial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAsAdminOfficial(false)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        !asAdminOfficial
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                          : 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200'
                      }`}
                    >
                      <span>Robert García (Personal)</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                      {user?.displayName || 'Usuario Orion'} &lt;{user?.email || 'me@orion.app'}&gt;
                    </span>
                    <span className="text-[10px] text-neutral-400 shrink-0">
                      (Emisión estándar)
                    </span>
                  </div>
                )}
              </div>

              {/* Destination method: Gmail or Orion */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-neutral-400 text-[11px]">Vía:</span>
                <select
                  value={sendAccount}
                  onChange={(e) => setSendAccount(e.target.value as any)}
                  className="text-xs bg-white dark:bg-[#252525] border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-neutral-800 dark:text-neutral-200 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="orion">Buzón Orion (Cloud Firestore)</option>
                  <option value="gmail">Gmail Real (API de Google)</option>
                </select>
              </div>
            </div>

            {/* Admin Broadcast Option */}
            {isAdmin && (
              <div className="pt-1.5 flex items-center justify-between border-t border-neutral-200/50 dark:border-neutral-800/50">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="broadcast-toggle"
                    checked={isBroadcast}
                    onChange={handleToggleBroadcast}
                    className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <label
                    htmlFor="broadcast-toggle"
                    className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Comunicado Oficial a todos los usuarios del ecosistema Orion</span>
                  </label>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                  Privilegio exclusivo: robert.garcia.alsina2012@gmail.com
                </span>
              </div>
            )}

            {/* Non-admin notice */}
            {!isAdmin && (
              <p className="text-[10px] text-neutral-400 italic">
                * Solo el Administrador ({ORION_ADMIN_EMAIL}) puede emitir comunicados con la marca y dirección oficial de Orion Workspace.
              </p>
            )}

            {/* Gmail Warning if not connected */}
            {sendAccount === 'gmail' && !isGoogleConnected && (
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Para enviar mediante Gmail real, primero conecta tu cuenta de Google.</span>
                </div>
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="px-2.5 py-1 rounded bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Conectar Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Recipients "Para" */}
          <div className="px-4 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center gap-3">
            <label className="text-xs font-semibold text-neutral-400 w-14 shrink-0">Para:</label>
            <input
              type="text"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="correo@ejemplo.com (o varios separados por comas)"
              className="w-full text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 bg-transparent focus:outline-none"
            />
          </div>

          {/* Subject "Asunto" */}
          <div className="px-4 py-2 border-b border-neutral-200/60 dark:border-neutral-800/60 flex items-center gap-3">
            <label className="text-xs font-semibold text-neutral-400 w-14 shrink-0">Asunto:</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del mensaje..."
              className="w-full text-xs font-semibold text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 bg-transparent focus:outline-none"
            />
          </div>

          {/* Subheader tabs: Redactar vs Vista previa */}
          <div className="h-9 px-4 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-[#1e1e1e]/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setComposeTab('write')}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  composeTab === 'write'
                    ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Escribir</span>
              </button>
              <button
                type="button"
                onClick={() => setComposeTab('preview')}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  composeTab === 'preview'
                    ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-white font-semibold shadow-2xs'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Vista previa con estilos e imágenes</span>
              </button>
            </div>

            <span className="text-[11px] text-neutral-400">
              Soporta Markdown (**negrita**, _cursiva_, imágenes)
            </span>
          </div>

          {/* Message Area or Preview Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {composeTab === 'write' ? (
              <textarea
                ref={textareaRef}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Escribe tu mensaje aquí. Puedes usar **negrita**, _cursiva_, ~~tachado~~, listas y pegar imágenes con ![título](url)..."
                rows={9}
                className="w-full h-full text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 bg-transparent focus:outline-none resize-none leading-relaxed font-sans"
              />
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Previsualización en tiempo real:
                </p>
                <EmailBodyRenderer
                  body={body || '*No hay texto escrito todavía en el mensaje.*'}
                  subject={subject}
                />
              </div>
            )}
          </div>

          {/* Image Insert Popover / Prompt */}
          {showImagePrompt && (
            <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#222222] space-y-2 select-none">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  <span>Insertar imagen en el correo</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowImagePrompt(false)}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#181818] text-neutral-900 dark:text-neutral-100 focus:outline-none text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customImageAlt}
                    onChange={(e) => setCustomImageAlt(e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#181818] text-neutral-900 dark:text-neutral-100 focus:outline-none text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleInsertImage}
                    disabled={!customImageUrl.trim()}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-40 transition-colors cursor-pointer text-xs shrink-0"
                  >
                    Insertar
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[10.5px] text-neutral-500 dark:text-neutral-400">
                <span>Ejemplo rápido:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomImageUrl('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1200&q=80');
                    setCustomImageAlt('Gradiente Orion');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 underline hover:opacity-80"
                >
                  Banner Gradiente
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomImageUrl('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80');
                    setCustomImageAlt('Fotografía de Naturaleza');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 underline hover:opacity-80"
                >
                  Fotografía HD
                </button>
              </div>
            </div>
          )}

          {/* Bottom Toolbar & Send Button */}
          <div className="h-14 px-4 border-t border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50 dark:bg-[#181818] flex items-center justify-between shrink-0">
            {/* Formatting tools */}
            <div className="flex items-center gap-1 text-neutral-500">
              <button
                type="button"
                onClick={() => applyFormat('**', '**', 'texto en negrita')}
                className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Negrita (**texto**)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('_', '_', 'texto en cursiva')}
                className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Cursiva (_texto_)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('~~', '~~', 'texto tachado')}
                className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Tachado (~~texto~~)"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('### ', '', 'Encabezado')}
                className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Encabezado (###)"
              >
                <Heading className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('\n- ', '', 'Elemento de lista')}
                className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Lista (- elemento)"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('\n> ', '', 'Cita destacada')}
                className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Cita (> cita)"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('`', '`', 'código')}
                className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Código en línea (`código`)"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => applyFormat('[', '](https://ejemplo.com)', 'Texto del enlace')}
                className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title="Insertar enlace"
              >
                <LinkIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowImagePrompt((prev) => !prev)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  showImagePrompt
                    ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'hover:bg-neutral-200 dark:hover:bg-neutral-800'
                }`}
                title="Insertar imagen"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Descartar
              </button>
              <button
                type="submit"
                disabled={!to.trim() || !subject.trim() || isSending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-40 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                <span>
                  {isSending
                    ? 'Enviando...'
                    : sendAccount === 'gmail'
                    ? 'Enviar vía Gmail'
                    : 'Enviar mensaje'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
