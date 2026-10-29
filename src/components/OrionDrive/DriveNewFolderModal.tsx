import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Folder, FolderPlus, Check } from 'lucide-react';

interface DriveNewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (name: string, color: string) => void;
}

const FOLDER_COLORS = [
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Slate', hex: '#64748B' },
];

export const DriveNewFolderModal: React.FC<DriveNewFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
}) => {
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#8B5CF6');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setSelectedColor('#8B5CF6');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    onCreateFolder(folderName.trim(), selectedColor);
    onClose();
  };

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
          className="relative w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: selectedColor }}
              >
                <Folder className="w-4 h-4 fill-current opacity-90" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Nueva Carpeta
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Nombre de la carpeta
              </label>
              <input
                ref={inputRef}
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Ej. Diseños de Aplicación, Documentos Legales..."
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Color de identificación
              </label>
              <div className="flex items-center gap-2.5">
                {FOLDER_COLORS.map((c) => {
                  const isSelected = selectedColor === c.hex;
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        isSelected ? 'scale-110 ring-2 ring-offset-2 ring-neutral-400 dark:ring-offset-[#1e1e1e]' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!folderName.trim()}
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Crear carpeta
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
