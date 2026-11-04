import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  Download,
  Star,
  Pencil,
  Trash2,
  FolderOpen,
  FolderPlus,
  UploadCloud,
  Copy,
  RotateCcw,
  LayoutGrid,
  List,
  HardDrive,
  CheckSquare,
  Palette,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { DriveFile, DriveFolder, DriveViewMode, DriveSortField } from './DriveTypes';

export interface ContextMenuTarget {
  type: 'file' | 'folder' | 'canvas';
  file?: DriveFile;
  folder?: DriveFolder;
}

interface DriveContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  target: ContextMenuTarget;
  onClose: () => void;
  // File actions
  onOpenFilePreview?: (file: DriveFile) => void;
  onDownloadFile?: (file: DriveFile) => void;
  onToggleStarFile?: (fileId: string) => void;
  onDeleteFile?: (fileId: string) => void;
  onRestoreFile?: (fileId: string) => void;
  onPermanentDeleteFile?: (fileId: string) => void;
  onRenameFile?: (file: DriveFile) => void;
  onCopyLink?: (file: DriveFile) => void;
  // Folder actions
  onOpenFolder?: (folderId: string) => void;
  onToggleStarFolder?: (folderId: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  onRestoreFolder?: (folderId: string) => void;
  onPermanentDeleteFolder?: (folderId: string) => void;
  onRenameFolder?: (folder: DriveFolder) => void;
  onChangeFolderColor?: (folderId: string, color: string) => void;
  // Canvas actions
  onNewFolder?: () => void;
  onUploadFile?: () => void;
  onToggleViewMode?: (mode: DriveViewMode) => void;
  viewMode?: DriveViewMode;
  onSortChange?: (field: DriveSortField) => void;
  sortField?: DriveSortField;
  onOpenStorage?: () => void;
  onSelectAll?: () => void;
  isTrashSection?: boolean;
}

const FOLDER_COLORS = [
  { name: 'Índigo', hex: '#6366F1' },
  { name: 'Violeta', hex: '#8B5CF6' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Cian', hex: '#06B6D4' },
  { name: 'Pizarra', hex: '#64748B' },
];

export const DriveContextMenu: React.FC<DriveContextMenuProps> = ({
  isOpen,
  position,
  target,
  onClose,
  onOpenFilePreview,
  onDownloadFile,
  onToggleStarFile,
  onDeleteFile,
  onRestoreFile,
  onPermanentDeleteFile,
  onRenameFile,
  onCopyLink,
  onOpenFolder,
  onToggleStarFolder,
  onDeleteFolder,
  onRestoreFolder,
  onPermanentDeleteFolder,
  onRenameFolder,
  onChangeFolderColor,
  onNewFolder,
  onUploadFile,
  onToggleViewMode,
  viewMode,
  onSortChange,
  sortField,
  onOpenStorage,
  onSelectAll,
  isTrashSection = false,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x: position.x, y: position.y });
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Position calculation with window edge clamping
  useEffect(() => {
    if (!isOpen) {
      setShowColorPicker(false);
      return;
    }

    const updatePosition = () => {
      const menuWidth = 230;
      const menuHeight = 280;
      const padding = 12;

      let x = position.x;
      let y = position.y;

      if (x + menuWidth > window.innerWidth - padding) {
        x = window.innerWidth - menuWidth - padding;
      }
      if (y + menuHeight > window.innerHeight - padding) {
        y = window.innerHeight - menuHeight - padding;
      }
      if (x < padding) x = padding;
      if (y < padding) y = padding;

      setAdjustedPos({ x, y });
    };

    updatePosition();
  }, [isOpen, position]);

  // Click outside & Escape key handlers
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none select-none">
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.94, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            top: adjustedPos.y,
            left: adjustedPos.x,
          }}
          className="absolute pointer-events-auto min-w-[210px] w-max max-w-[260px] rounded-2xl bg-white/95 dark:bg-[#1f1f1f]/95 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xl p-1.5 text-neutral-800 dark:text-neutral-200 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Target: FILE */}
          {target.type === 'file' && target.file && (
            <div className="space-y-0.5">
              {/* File Title Header */}
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 truncate border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
                {target.file.name}
              </div>

              {!target.file.isTrash && !isTrashSection ? (
                <>
                  <button
                    onClick={() => {
                      onOpenFilePreview?.(target.file!);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Eye className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span>Vista previa</span>
                  </button>

                  <button
                    onClick={() => {
                      onDownloadFile?.(target.file!);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Descargar</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onToggleStarFile?.(target.file!.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <div className="flex items-center gap-2.5">
                      <Star
                        className={`w-3.5 h-3.5 shrink-0 ${
                          target.file.isStarred
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-amber-500'
                        }`}
                      />
                      <span>
                        {target.file.isStarred
                          ? 'Quitar de destacados'
                          : 'Marcar como destacado'}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onRenameFile?.(target.file!);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Cambiar nombre</span>
                  </button>

                  <button
                    onClick={() => {
                      onCopyLink?.(target.file!);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Copiar enlace / datos</span>
                  </button>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

                  <button
                    onClick={() => {
                      onDeleteFile?.(target.file!.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Mover a la papelera</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onRestoreFile?.(target.file!.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Restaurar archivo</span>
                  </button>

                  <button
                    onClick={() => {
                      onPermanentDeleteFile?.(target.file!.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Eliminar definitivamente</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Target: FOLDER */}
          {target.type === 'folder' && target.folder && (
            <div className="space-y-0.5">
              {/* Folder Title Header */}
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 truncate border-b border-neutral-100 dark:border-neutral-800/80 mb-1">
                {target.folder.name}
              </div>

              {!target.folder.isTrash && !isTrashSection ? (
                <>
                  <button
                    onClick={() => {
                      onOpenFolder?.(target.folder!.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span>Abrir carpeta</span>
                  </button>

                  <button
                    onClick={() => {
                      onToggleStarFolder?.(target.folder!.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <div className="flex items-center gap-2.5">
                      <Star
                        className={`w-3.5 h-3.5 shrink-0 ${
                          target.folder.isStarred
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-amber-500'
                        }`}
                      />
                      <span>
                        {target.folder.isStarred
                          ? 'Quitar de destacados'
                          : 'Marcar como destacada'}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onRenameFolder?.(target.folder!);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Cambiar nombre</span>
                  </button>

                  {/* Folder Color Quick Selection */}
                  <div className="px-2.5 py-1.5">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="w-full flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <Palette className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                        <span>Color de carpeta</span>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20"
                        style={{ backgroundColor: target.folder.color || '#8B5CF6' }}
                      />
                    </button>

                    {showColorPicker && (
                      <div className="flex items-center gap-1.5 pt-2 pb-1 overflow-x-auto no-scrollbar">
                        {FOLDER_COLORS.map((col) => (
                          <button
                            key={col.hex}
                            onClick={() => {
                              onChangeFolderColor?.(target.folder!.id, col.hex);
                              onClose();
                            }}
                            title={col.name}
                            className={`w-4 h-4 rounded-full transition-transform hover:scale-125 cursor-pointer shrink-0 ${
                              target.folder?.color === col.hex
                                ? 'ring-2 ring-violet-500 ring-offset-1 dark:ring-offset-[#1f1f1f]'
                                : ''
                            }`}
                            style={{ backgroundColor: col.hex }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

                  <button
                    onClick={() => {
                      onDeleteFolder?.(target.folder!.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Mover a la papelera</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onRestoreFolder?.(target.folder!.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Restaurar carpeta</span>
                  </button>

                  <button
                    onClick={() => {
                      onPermanentDeleteFolder?.(target.folder!.id);
                      onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Eliminar definitivamente</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Target: CANVAS / BACKGROUND */}
          {target.type === 'canvas' && (
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  onNewFolder?.();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
              >
                <FolderPlus className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span>Nueva carpeta</span>
              </button>

              <button
                onClick={() => {
                  onUploadFile?.();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
              >
                <UploadCloud className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Subir archivos</span>
              </button>

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

              {/* View Mode Toggle */}
              <button
                onClick={() => {
                  onToggleViewMode?.(viewMode === 'grid' ? 'list' : 'grid');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
              >
                <div className="flex items-center gap-2.5">
                  {viewMode === 'grid' ? (
                    <List className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  ) : (
                    <LayoutGrid className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  )}
                  <span>Cambiar a vista de {viewMode === 'grid' ? 'lista' : 'cuadrícula'}</span>
                </div>
              </button>

              {/* Sort Options */}
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 pt-1.5">
                Ordenar por
              </div>
              <div className="grid grid-cols-3 gap-1 px-1 pb-1">
                {(['date', 'name', 'size'] as DriveSortField[]).map((field) => (
                  <button
                    key={field}
                    onClick={() => {
                      onSortChange?.(field);
                      onClose();
                    }}
                    className={`py-1 text-[11px] rounded-lg transition-colors cursor-pointer text-center capitalize font-medium ${
                      sortField === field
                        ? 'bg-violet-600 text-white font-semibold'
                        : 'bg-neutral-100/70 dark:bg-[#282828] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {field === 'date' ? 'Fecha' : field === 'name' ? 'Nombre' : 'Tamaño'}
                  </button>
                ))}
              </div>

              <div className="my-1 border-t border-neutral-100 dark:border-neutral-800/80" />

              <button
                onClick={() => {
                  onSelectAll?.();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
              >
                <CheckSquare className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>Seleccionar todo</span>
              </button>

              <button
                onClick={() => {
                  onOpenStorage?.();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-700 dark:text-neutral-200 transition-colors text-left cursor-pointer font-medium"
              >
                <HardDrive className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                <span>Ver uso de almacenamiento</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
