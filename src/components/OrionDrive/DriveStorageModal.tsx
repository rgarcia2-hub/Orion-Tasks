import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cloud, HardDrive, Trash2, CheckCircle2, ShieldCheck, Database, FileText, Image as ImageIcon, Music, Code2 } from 'lucide-react';
import { DriveFile, FORMAT_FILE_SIZE } from './DriveTypes';

interface DriveStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: DriveFile[];
  onEmptyTrash: () => void;
}

export const DriveStorageModal: React.FC<DriveStorageModalProps> = ({
  isOpen,
  onClose,
  files,
  onEmptyTrash,
}) => {
  if (!isOpen) return null;

  const activeFiles = files.filter((f) => !f.isTrash);
  const trashFiles = files.filter((f) => f.isTrash);
  const trashBytes = trashFiles.reduce((acc, f) => acc + (f.size || 0), 0);

  // Group by category
  const docsSize = activeFiles.filter((f) => f.category === 'document').reduce((a, f) => a + (f.size || 0), 0);
  const imgSize = activeFiles.filter((f) => f.category === 'image').reduce((a, f) => a + (f.size || 0), 0);
  const codeSize = activeFiles.filter((f) => f.category === 'code').reduce((a, f) => a + (f.size || 0), 0);
  const mediaSize = activeFiles.filter((f) => f.category === 'media').reduce((a, f) => a + (f.size || 0), 0);
  const otherSize = activeFiles.filter((f) => ['data', 'archive', 'other'].includes(f.category)).reduce((a, f) => a + (f.size || 0), 0);

  const totalUsedBytes = docsSize + imgSize + codeSize + mediaSize + otherSize + 14800000000; // includes base system files
  const totalQuotaBytes = 100 * 1024 * 1024 * 1024; // 100 GB

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-2xs">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Cuota de Almacenamiento
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Orion Cloud Storage · Plan Pro
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Usage Gauge */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black font-mono text-neutral-900 dark:text-white">
                  {FORMAT_FILE_SIZE(totalUsedBytes)}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium ml-1.5">
                  utilizados de 100 GB
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-mono">
                14.8% usado
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-3 rounded-full bg-neutral-200 dark:bg-[#333333] flex overflow-hidden">
              <div style={{ width: '40%' }} className="bg-blue-500 h-full" title="Documentos" />
              <div style={{ width: '25%' }} className="bg-pink-500 h-full" title="Imágenes" />
              <div style={{ width: '20%' }} className="bg-purple-500 h-full" title="Multimedia" />
              <div style={{ width: '15%' }} className="bg-emerald-500 h-full" title="Código & Datos" />
            </div>

            {/* Categories breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <span>Documentos: {FORMAT_FILE_SIZE(docsSize + 4400000000)}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                <span>Imágenes: {FORMAT_FILE_SIZE(imgSize + 2900000000)}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <span>Media & Audio: {FORMAT_FILE_SIZE(mediaSize + 8900000000)}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Código & Config: {FORMAT_FILE_SIZE(codeSize + otherSize + 50000000)}</span>
              </div>
            </div>
          </div>

          {/* Clean up trash banner */}
          {trashFiles.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Hay {trashFiles.length} elementos en papelera ({FORMAT_FILE_SIZE(trashBytes)})</span>
              </div>
              <button
                onClick={() => {
                  onEmptyTrash();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold cursor-pointer transition-colors shrink-0"
              >
                Vaciar ahora
              </button>
            </div>
          )}

          {/* Security & Cloud info */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Encriptado en tránsito y en reposo con AES-256 de alta seguridad.</span>
          </div>

          <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
