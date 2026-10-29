import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Star,
  Trash2,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Code2,
  Music,
  Database,
  Calendar,
  User,
  Share2,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { DriveFile, FORMAT_FILE_SIZE } from './DriveTypes';

interface DriveFilePreviewModalProps {
  file: DriveFile | null;
  onClose: () => void;
  onToggleStar: (fileId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDownloadFile: (file: DriveFile) => void;
}

export const DriveFilePreviewModal: React.FC<DriveFilePreviewModalProps> = ({
  file,
  onClose,
  onToggleStar,
  onDeleteFile,
  onDownloadFile,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);

  if (!file) return null;

  const handleCopyContent = () => {
    if (file.textContent) {
      navigator.clipboard.writeText(file.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = () => {
    const dummyUrl = `${window.location.origin}/drive/share/${file.id}`;
    navigator.clipboard.writeText(dummyUrl);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2000);
  };

  // Render CSV table if data file
  const renderCsvTable = (csvContent: string) => {
    const lines = csvContent.trim().split('\n').filter(Boolean);
    if (lines.length === 0) return null;
    const headers = lines[0].split(',');
    const rows = lines.slice(1).map((r) => r.split(','));

    return (
      <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1a1a1a]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-50 dark:bg-[#222222] border-b border-neutral-200 dark:border-neutral-800">
              {headers.map((h, i) => (
                <th key={i} className="py-2.5 px-3.5 font-semibold text-neutral-700 dark:text-neutral-300">
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80 font-mono text-[11px]">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-neutral-50/50 dark:hover:bg-[#252525]/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-2 px-3.5 text-neutral-600 dark:text-neutral-400">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden z-10 flex flex-col"
        >
          {/* Top Bar */}
          <div className="h-14 px-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-4 bg-neutral-50/80 dark:bg-[#242424] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 shrink-0">
                {file.category === 'image' ? (
                  <ImageIcon className="w-4 h-4" />
                ) : file.category === 'code' ? (
                  <Code2 className="w-4 h-4" />
                ) : file.category === 'data' ? (
                  <Database className="w-4 h-4" />
                ) : file.category === 'media' ? (
                  <Music className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {file.name}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  <span>{FORMAT_FILE_SIZE(file.size)}</span>
                  <span>•</span>
                  <span className="uppercase">{file.extension}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onToggleStar(file.id)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  file.isStarred
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 border-amber-300 dark:border-amber-800'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#2d2d2d] border-neutral-200 dark:border-neutral-700'
                }`}
                title={file.isStarred ? 'Quitar de destacados' : 'Marcar como destacado'}
              >
                <Star className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={handleShareLink}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
                title="Copiar enlace de compartición"
              >
                {shareLinkCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => onDownloadFile(file)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Descargar a tu dispositivo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>

              <button
                onClick={() => {
                  onDeleteFile(file.id);
                  onClose();
                }}
                className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Mover a papelera"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2d2d2d] transition-colors cursor-pointer"
                title="Cerrar vista previa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Content Preview Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#f8f8f7] dark:bg-[#171717] flex flex-col items-center justify-center min-h-[380px]">
            {file.category === 'image' && (file.dataUrl || file.name.endsWith('.png') || file.name.endsWith('.jpg')) ? (
              <div className="flex flex-col items-center justify-center max-w-full">
                <img
                  src={file.dataUrl || 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80'}
                  alt={file.name}
                  className="max-h-[58vh] max-w-full object-contain rounded-xl shadow-lg border border-neutral-300 dark:border-neutral-700"
                />
              </div>
            ) : file.category === 'data' && file.textContent ? (
              <div className="w-full max-w-3xl space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Vista previa de datos tabulares</span>
                  <button
                    onClick={handleCopyContent}
                    className="flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar CSV'}</span>
                  </button>
                </div>
                {renderCsvTable(file.textContent)}
              </div>
            ) : file.textContent ? (
              <div className="w-full max-w-3xl flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1e1e1e] shadow-sm overflow-hidden">
                <div className="h-9 px-4 bg-neutral-50 dark:bg-[#252525] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-mono">{file.name} ({file.textContent.split('\n').length} líneas)</span>
                  <button
                    onClick={handleCopyContent}
                    className="flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
                  </button>
                </div>
                <pre className="p-4 overflow-auto max-h-[50vh] text-xs font-mono leading-relaxed text-neutral-800 dark:text-neutral-200 select-text whitespace-pre-wrap">
                  {file.textContent}
                </pre>
              </div>
            ) : file.category === 'media' ? (
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 shadow-sm max-w-md text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Music className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{file.name}</h4>
                  <p className="text-xs text-neutral-500 mt-1">Archivo de reproducción multimedia Orion Sound Lab</p>
                </div>
                <audio controls className="w-full mt-2">
                  <source src={file.dataUrl || ''} type={file.mimeType} />
                  Tu navegador no soporta el reproductor de audio.
                </audio>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-center text-neutral-500">
                <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-600" />
                <p className="text-sm font-medium">Este formato no cuenta con vista previa interactiva directa.</p>
                <button
                  onClick={() => onDownloadFile(file)}
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 cursor-pointer"
                >
                  Descargar para abrir localmente
                </button>
              </div>
            )}
          </div>

          {/* Bottom Info Strip */}
          <div className="h-11 px-5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#222222] flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
            <div className="flex items-center gap-3">
              <span>Modificado: {new Date(file.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              {file.author && <span>• Autor: {file.author}</span>}
            </div>
            {file.tags && file.tags.length > 0 && (
              <div className="flex items-center gap-1.5">
                {file.tags.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] text-neutral-600 dark:text-neutral-300 font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
