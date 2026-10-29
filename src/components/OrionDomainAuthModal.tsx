import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Key,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface OrionDomainAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
}

export const OrionDomainAuthModal: React.FC<OrionDomainAuthModalProps> = ({
  isOpen,
  onClose,
  domain,
}) => {
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);

  if (!isOpen) return null;

  const currentDomain = domain || (typeof window !== 'undefined' ? window.location.hostname : 'orionworkspace.vercel.app');
  const projectId = firebaseConfig.projectId || 'gen-lang-client-0145481802';
  const oAuthClientId = (firebaseConfig as any).oAuthClientId || '598472241341-6o2nu498275v0hcevsvf6k36tf2br3q9.apps.googleusercontent.com';

  const firebaseAuthSettingsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;
  const gcpCredentialsUrl = `https://console.cloud.google.com/apis/credentials?project=${projectId}`;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentDomain);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleCopyProjectId = () => {
    navigator.clipboard.writeText(projectId);
    setCopiedProjectId(true);
    setTimeout(() => setCopiedProjectId(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10 flex flex-col"
        >
          {/* Top Banner */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-200/80 dark:border-amber-900/40 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Autorizar dominio en Firebase
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    auth/unauthorized-domain
                  </span>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">
                  Para poder iniciar sesión con Google desde un dominio nuevo (como Vercel), Firebase requiere que el dominio esté en la lista de dominios autorizados.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Steps & Quick Copy */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            {/* Domain to add card */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
                  Dominio que debes añadir
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Globe className="w-4 h-4 text-violet-500 shrink-0" />
                  <span className="text-sm font-mono font-bold text-neutral-900 dark:text-white truncate">
                    {currentDomain}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopyDomain}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#303030] hover:bg-neutral-100 dark:hover:bg-[#383838] border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Step 1 */}
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#222222] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[11px] font-bold flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Añadir en Firebase Authentication (Esencial)
                  </h4>
                </div>
                <a
                  href={firebaseAuthSettingsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  <span>Abrir Consola Firebase</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1 list-decimal list-inside pl-1 leading-relaxed">
                <li>Ve a la pestaña <strong>Settings</strong> (Ajustes) en Authentication.</li>
                <li>Baja hasta la sección <strong>Authorized domains</strong> (Dominios autorizados).</li>
                <li>Pulsa <strong>Add domain</strong> (Añadir dominio).</li>
                <li>Pega <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-violet-600 dark:text-violet-400 font-semibold">{currentDomain}</code> y pulsa <strong>Guardar</strong>.</li>
              </ol>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#222222] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    Añadir en Google Cloud Console (OAuth Client)
                  </h4>
                </div>
                <a
                  href={gcpCredentialsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Credenciales Google Cloud</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <ol className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1 list-decimal list-inside pl-1 leading-relaxed">
                <li>Abre el cliente web de OAuth 2.0 (ID del proyecto: <code className="font-mono text-[11px]">{projectId}</code>).</li>
                <li>En <strong>Orígenes de JavaScript autorizados</strong>, añade:
                  <div className="mt-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded">
                    https://{currentDomain}
                  </div>
                </li>
                <li>Guarda los cambios. El cambio suele tener efecto en 1 o 2 minutos.</li>
              </ol>
            </div>

            {/* Project Details */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-[#252525] text-[11px] text-neutral-500 dark:text-neutral-400 space-y-1 font-mono">
              <div className="flex items-center justify-between">
                <span>Firebase Project ID:</span>
                <span className="text-neutral-900 dark:text-neutral-200 font-semibold">{projectId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auth Domain Firebase:</span>
                <span className="text-neutral-900 dark:text-neutral-200 font-semibold">{firebaseConfig.authDomain}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-neutral-50 dark:bg-[#222222] border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Solo toma 30 segundos configurarlo.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
