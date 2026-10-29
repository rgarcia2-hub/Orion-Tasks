import React from 'react';
import { motion } from 'motion/react';
import {
  HardDrive,
  Clock,
  Star,
  Users,
  Trash2,
  Plus,
  FolderPlus,
  Upload,
  FileText,
  Image as ImageIcon,
  Code2,
  Music,
  Database,
  Cloud,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  DriveViewSection,
  DriveFilterCategory,
  DriveFolder,
  DriveFile,
  FORMAT_FILE_SIZE,
} from './DriveTypes';

interface DriveSidebarProps {
  currentSection: DriveViewSection;
  onSelectSection: (section: DriveViewSection) => void;
  selectedCategory: DriveFilterCategory;
  onSelectCategory: (cat: DriveFilterCategory) => void;
  onOpenNewFolder: () => void;
  onTriggerFileUpload: () => void;
  onOpenStorageInfo: () => void;
  files: DriveFile[];
  folders: DriveFolder[];
  isUploading?: boolean;
}

export const DriveSidebar: React.FC<DriveSidebarProps> = ({
  currentSection,
  onSelectSection,
  selectedCategory,
  onSelectCategory,
  onOpenNewFolder,
  onTriggerFileUpload,
  onOpenStorageInfo,
  files,
  folders,
  isUploading = false,
}) => {
  const activeFiles = files.filter((f) => !f.isTrash);
  const starredCount = activeFiles.filter((f) => f.isStarred).length;
  const trashCount = files.filter((f) => f.isTrash).length;

  // Calculate used storage
  const totalBytesUsed = activeFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalBytesQuota = 100 * 1024 * 1024 * 1024; // 100 GB
  const usedPercent = Math.min(100, Math.max(1, (totalBytesUsed / (10 * 1024 * 1024 * 1024)) * 100)); // normalized preview scale

  const navSections: { id: DriveViewSection; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'all',
      label: 'Mi Unidad',
      icon: <HardDrive className="w-4 h-4" />,
      count: activeFiles.length + folders.filter((f) => !f.isTrash).length,
    },
    {
      id: 'recents',
      label: 'Recientes',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      id: 'starred',
      label: 'Destacados',
      icon: <Star className="w-4 h-4" />,
      count: starredCount > 0 ? starredCount : undefined,
    },
    {
      id: 'shared',
      label: 'Compartidos',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'trash',
      label: 'Papelera',
      icon: <Trash2 className="w-4 h-4" />,
      count: trashCount > 0 ? trashCount : undefined,
    },
  ];

  const categoryFilters: { id: DriveFilterCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'document', label: 'Documentos', icon: <FileText className="w-3.5 h-3.5" />, color: 'text-blue-500' },
    { id: 'image', label: 'Imágenes', icon: <ImageIcon className="w-3.5 h-3.5" />, color: 'text-pink-500' },
    { id: 'code', label: 'Código & Scripts', icon: <Code2 className="w-3.5 h-3.5" />, color: 'text-emerald-500' },
    { id: 'data', label: 'Hojas & Datos', icon: <Database className="w-3.5 h-3.5" />, color: 'text-amber-500' },
    { id: 'media', label: 'Audio & Media', icon: <Music className="w-3.5 h-3.5" />, color: 'text-purple-500' },
  ];

  return (
    <aside className="w-64 h-full bg-[#fbfbfa] dark:bg-[#181818] border-r border-[#e9e9e7] dark:border-[#272727] flex flex-col justify-between shrink-0 select-none overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Quick Action Button Group with smooth hover animations */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onTriggerFileUpload}
              disabled={isUploading}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all duration-200"
              title="Subir archivos desde tu ordenador"
            >
              <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-bounce' : ''}`} />
              <span>{isUploading ? 'Subiendo...' : 'Subir'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenNewFolder}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-[#222222] hover:bg-neutral-100 dark:hover:bg-[#2b2b2b] text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-200 dark:border-neutral-700/80 shadow-2xs cursor-pointer transition-all duration-200"
              title="Crear nueva carpeta en la ubicación actual"
            >
              <FolderPlus className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>Carpeta</span>
            </motion.button>
          </div>
        </div>

        {/* Primary Sections */}
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
            Navegación
          </div>
          {navSections.map((item) => {
            const isActive = currentSection === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  onSelectSection(item.id);
                  onSelectCategory('all');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-violet-100/70 text-violet-900 dark:bg-violet-950/40 dark:text-violet-200 font-semibold'
                    : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#222222]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-violet-600 dark:text-violet-400' : 'text-neutral-400 dark:text-neutral-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-violet-200/70 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 font-semibold'
                        : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* File Type Filter Categories */}
        <div className="space-y-1 pt-2 border-t border-neutral-200/70 dark:border-neutral-800">
          <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
            <span>Filtros Rápidos</span>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => onSelectCategory('all')}
                className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline cursor-pointer lowercase"
              >
                Limpiar
              </button>
            )}
          </div>
          {categoryFilters.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            const countForCat = activeFiles.filter((f) => f.category === cat.id).length;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectCategory(isCatActive ? 'all' : cat.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  isCatActive
                    ? 'bg-neutral-200/80 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#222222]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={cat.color}>{cat.icon}</span>
                  <span>{cat.label}</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                  {countForCat}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Storage Meter Card */}
      <div className="p-4 border-t border-[#e9e9e7] dark:border-[#272727] bg-neutral-50/70 dark:bg-[#1a1a1a]">
        <div className="p-3 rounded-xl bg-white dark:bg-[#202020] border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
              <Cloud className="w-3.5 h-3.5 text-violet-500" />
              <span>Almacenamiento</span>
            </div>
            <button
              onClick={onOpenStorageInfo}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              title="Ver detalles de cuota"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-[#2b2b2b] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(12, usedPercent)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-fuchsia-500 rounded-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              <span>{FORMAT_FILE_SIZE(totalBytesUsed + 14800000000)}</span>
              <span>100 GB</span>
            </div>
          </div>

          <button
            onClick={onOpenStorageInfo}
            className="w-full py-1 text-center text-[10px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
          >
            Gestionar cuota cloud →
          </button>
        </div>
      </div>
    </aside>
  );
};
