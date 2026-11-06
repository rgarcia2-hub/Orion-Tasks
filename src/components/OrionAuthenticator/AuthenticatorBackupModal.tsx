import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  FileJson,
} from 'lucide-react';
import { AuthenticatorToken } from '../../types/authenticator';

interface AuthenticatorBackupModalProps {
  isOpen: boolean;
  tokens: AuthenticatorToken[];
  onClose: () => void;
  onImportTokens: (tokens: AuthenticatorToken[]) => void;
  onShowToast: (msg: string) => void;
}

export const AuthenticatorBackupModal: React.FC<AuthenticatorBackupModalProps> = ({
  isOpen,
  tokens,
  onClose,
  onImportTokens,
  onShowToast,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const exportPayload = {
    version: '1.0',
    app: 'Orion Authenticator',
    exportedAt: new Date().toISOString(),
    tokensCount: tokens.length,
    tokens: tokens.map((t) => ({
      id: t.id,
      issuer: t.issuer,
      account: t.account,
      secret: t.secret,
      algorithm: t.algorithm || 'SHA1',
      digits: t.digits || 6,
      period: t.period || 30,
      folder: t.folder || 'Personal',
      color: t.color,
      icon: t.icon,
      isPinned: t.isPinned,
    })),
  };

  const exportJsonString = JSON.stringify(exportPayload, null, 2);

  const handleDownloadBackup = () => {
    const blob = new Blob([exportJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orion-authenticator-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Copia de seguridad descargada.');
  };

  const handleCopyBackup = async () => {
    try {
      await navigator.clipboard.writeText(exportJsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onShowToast('Copia de seguridad copiada al portapapeles.');
    } catch {
      onShowToast('Error al copiar.');
    }
  };

  const parseAndApplyImport = (jsonStr: string) => {
    setImportError(null);
    try {
      const data = JSON.parse(jsonStr);
      let rawTokens: any[] = [];

      if (Array.isArray(data)) {
        rawTokens = data;
      } else if (data && Array.isArray(data.tokens)) {
        rawTokens = data.tokens;
      } else {
        setImportError('El formato del archivo no es válido. Debe contener una lista de tokens.');
        return;
      }

      if (rawTokens.length === 0) {
        setImportError('No se encontraron credenciales en el archivo.');
        return;
      }

      const validTokens: AuthenticatorToken[] = [];
      rawTokens.forEach((item, idx) => {
        if (item.secret) {
          validTokens.push({
            id: item.id || `token-imported-${Date.now()}-${idx}`,
            issuer: item.issuer || 'Servicio',
            account: item.account || 'Cuenta',
            secret: item.secret,
            algorithm: item.algorithm || 'SHA1',
            digits: item.digits || 6,
            period: item.period || 30,
            folder: item.folder || 'Personal',
            color: item.color || '#7C3AED',
            icon: item.icon || 'shield',
            isPinned: Boolean(item.isPinned),
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });

      if (validTokens.length === 0) {
        setImportError('Ningún elemento contenía una clave secreta válida.');
        return;
      }

      onImportTokens(validTokens);
      onShowToast(`${validTokens.length} credenciales restauradas con éxito.`);
      onClose();
    } catch {
      setImportError('Error de sintaxis JSON. Comprueba que el texto sea un JSON válido.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportJsonText(text);
      parseAndApplyImport(text);
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Copia de Seguridad y Restauración
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Transfiere o guarda tus credenciales en cualquier dispositivo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab selector */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-[#262626] border border-neutral-200/80 dark:border-neutral-700/80">
            <button
              onClick={() => setTab('export')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'export'
                  ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Copia ({tokens.length})</span>
            </button>
            <button
              onClick={() => setTab('import')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                tab === 'import'
                  ? 'bg-white dark:bg-[#1a1a1a] text-neutral-900 dark:text-white shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar / Restaurar</span>
            </button>
          </div>

          {tab === 'export' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200/80 dark:border-neutral-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Copia de Seguridad JSON
                  </span>
                  <span className="text-[11px] font-mono text-violet-600 dark:text-violet-400 font-semibold">
                    {tokens.length} cuentas
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Exporta un archivo seguro compatible con Orion y otros administradores para tener siempre una copia física fuera de la nube.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleDownloadBackup}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo JSON</span>
                </button>
                <button
                  onClick={handleCopyBackup}
                  className="py-2.5 px-4 rounded-xl bg-neutral-100 dark:bg-[#282828] hover:bg-neutral-200 dark:hover:bg-[#333] text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-violet-500 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer bg-neutral-50/60 dark:bg-[#242424]/60 transition-colors"
              >
                <FileJson className="w-8 h-8 text-violet-500 mb-2" />
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Selecciona archivo .json de copia de seguridad
                </h4>
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 max-w-xs mt-1">
                  O pega el contenido JSON en el campo inferior
                </p>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Pegar JSON manualmente
                </label>
                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Pega aquí el contenido JSON del backup..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!importJsonText.trim()}
                  onClick={() => parseAndApplyImport(importJsonText)}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restaurar Credenciales</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
