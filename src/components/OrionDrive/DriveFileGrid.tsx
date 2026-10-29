import React from 'react';
import { motion } from 'motion/react';
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Code2,
  Music,
  Database,
  Archive,
  File,
  Star,
  Download,
  Trash2,
  Eye,
  MoreVertical,
  Check,
  ExternalLink,
} from 'lucide-react';
import {
  DriveFile,
  DriveFolder,
  FORMAT_FILE_SIZE,
} from './DriveTypes';

interface DriveFileGridProps {
  folders: DriveFolder[];
  files: DriveFile[];
  onOpenFolder: (folderId: string) => void;
  onOpenFilePreview: (file: DriveFile) => void;
  onToggleStarFile: (fileId: string) => void;
  onToggleStarFolder: (folderId: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onDownloadFile: (file: DriveFile) => void;
  selectedFileIds: string[];
  onToggleSelectFile: (fileId: string) => void;
}

export const DriveFileGrid: React.FC<DriveFileGridProps> = ({
  folders,
  files,
  onOpenFolder,
  onOpenFilePreview,
  onToggleStarFile,
  onToggleStarFolder,
  onDeleteFile,
  onDeleteFolder,
  onDownloadFile,
  selectedFileIds,
  onToggleSelectFile,
}) => {
  const getFileCategoryIcon = (file: DriveFile) => {
    switch (file.category) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-pink-500" />;
      case 'code':
        return <Code2 className="w-8 h-8 text-emerald-500" />;
      case 'data':
        return <Database className="w-8 h-8 text-amber-500" />;
      case 'media':
        return <Music className="w-8 h-8 text-purple-500" />;
      case 'archive':
        return <Archive className="w-8 h-8 text-orange-500" />;
      default:
        return <FileText className="w-8 h-8 text-blue-500" />;
    }
  };

  const getExtensionBadgeColor = (ext: string) => {
    switch (ext) {
      case 'pdf':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300';
      case 'png':
      case 'jpg':
      case 'svg':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300';
      case 'ts':
      case 'tsx':
      case 'js':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300';
      case 'json':
      case 'csv':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
      case 'md':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
      case 'mp3':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300';
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Carpetas ({folders.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <motion.div
                key={folder.id}
                layout
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenFolder(folder.id)}
                className="group relative p-3.5 rounded-2xl bg-white dark:bg-[#202020] border border-neutral-200/90 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: folder.color || '#8B5CF6' }}
                  >
                    <Folder className="w-4 h-4 fill-current opacity-95" />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStarFolder(folder.id);
                    }}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      folder.isStarred
                        ? 'text-amber-500 opacity-100'
                        : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                    }`}
                    title={folder.isStarred ? 'Quitar de destacados' : 'Destacar carpeta'}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {folder.name}
                  </h4>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-mono">
                    Carpeta Orion
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Archivos ({files.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {files.map((file) => {
              const isSelected = selectedFileIds.includes(file.id);

              return (
                <motion.div
                  key={file.id}
                  layout
                  whileHover={{ y: -2 }}
                  onClick={() => onOpenFilePreview(file)}
                  className={`group relative rounded-2xl bg-white dark:bg-[#202020] border transition-all cursor-pointer flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs ${
                    isSelected
                      ? 'border-violet-500 ring-2 ring-violet-500/30 dark:ring-violet-500/20'
                      : 'border-neutral-200/90 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-800/80'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-3 pb-0 flex items-center justify-between z-10">
                    {/* Select Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelectFile(file.id);
                      }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-[#252525] opacity-0 group-hover:opacity-100 hover:border-violet-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${getExtensionBadgeColor(
                          file.extension
                        )}`}
                      >
                        {file.extension}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStarFile(file.id);
                        }}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          file.isStarred
                            ? 'text-amber-500 opacity-100'
                            : 'text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                        }`}
                        title={file.isStarred ? 'Quitar de favoritos' : 'Favorito'}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail / Icon Center */}
                  <div className="h-28 flex items-center justify-center p-3 relative overflow-hidden">
                    {file.category === 'image' && file.dataUrl ? (
                      <img
                        src={file.dataUrl}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-lg border border-neutral-200/60 dark:border-neutral-800/80 group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-[#282828] flex items-center justify-center transition-transform group-hover:scale-105">
                        {getFileCategoryIcon(file)}
                      </div>
                    )}

                    {/* Quick Hover Overlay */}
                    <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFilePreview(file);
                        }}
                        className="p-2 rounded-xl bg-white text-neutral-900 shadow-md hover:bg-neutral-100 transition-transform hover:scale-110 cursor-pointer"
                        title="Ver archivo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadFile(file);
                        }}
                        className="p-2 rounded-xl bg-white text-neutral-900 shadow-md hover:bg-neutral-100 transition-transform hover:scale-110 cursor-pointer"
                        title="Descargar"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFile(file.id);
                        }}
                        className="p-2 rounded-xl bg-white text-rose-600 shadow-md hover:bg-rose-50 transition-transform hover:scale-110 cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Info */}
                  <div className="p-3 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#232323]/50">
                    <h4
                      className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors"
                      title={file.name}
                    >
                      {file.name}
                    </h4>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-1">
                      <span>{FORMAT_FILE_SIZE(file.size)}</span>
                      <span>
                        {new Date(file.updatedAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
