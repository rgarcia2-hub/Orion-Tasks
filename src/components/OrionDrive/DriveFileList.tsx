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
  Star,
  Download,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';
import { DriveFile, DriveFolder, FORMAT_FILE_SIZE } from './DriveTypes';

interface DriveFileListProps {
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
  onSelectAll: () => void;
  isAllSelected: boolean;
}

export const DriveFileList: React.FC<DriveFileListProps> = ({
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
  onSelectAll,
  isAllSelected,
}) => {
  const getFileCategoryIcon = (file: DriveFile) => {
    switch (file.category) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-pink-500" />;
      case 'code':
        return <Code2 className="w-4 h-4 text-emerald-500" />;
      case 'data':
        return <Database className="w-4 h-4 text-amber-500" />;
      case 'media':
        return <Music className="w-4 h-4 text-purple-500" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="w-full rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#1e1e1e] overflow-hidden shadow-2xs select-none">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-neutral-50/80 dark:bg-[#242424] border-b border-neutral-200/90 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
            <th className="py-3 px-3 w-10 text-center">
              <button
                onClick={onSelectAll}
                className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                  isAllSelected
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#282828] hover:border-violet-500'
                }`}
              >
                {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            </th>
            <th className="py-3 px-3">Nombre</th>
            <th className="py-3 px-3 hidden md:table-cell">Tipo / Extensión</th>
            <th className="py-3 px-3 hidden sm:table-cell">Tamaño</th>
            <th className="py-3 px-3 hidden lg:table-cell">Modificación</th>
            <th className="py-3 px-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
          {/* Folders Rows */}
          {folders.map((folder) => (
            <tr
              key={folder.id}
              onClick={() => onOpenFolder(folder.id)}
              className="group hover:bg-neutral-50/80 dark:hover:bg-[#252525]/60 transition-colors cursor-pointer"
            >
              <td className="py-2.5 px-3 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStarFolder(folder.id);
                  }}
                  className={`p-1 transition-colors cursor-pointer ${
                    folder.isStarred
                      ? 'text-amber-500'
                      : 'text-neutral-300 dark:text-neutral-600 group-hover:text-amber-500'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: folder.color || '#8B5CF6' }}
                  >
                    <Folder className="w-3.5 h-3.5 fill-current" />
                  </div>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                    {folder.name}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3 hidden md:table-cell text-neutral-400 font-mono text-[11px]">
                Carpeta
              </td>
              <td className="py-2.5 px-3 hidden sm:table-cell text-neutral-400 font-mono text-[11px]">
                —
              </td>
              <td className="py-2.5 px-3 hidden lg:table-cell text-neutral-400 font-mono text-[11px]">
                {new Date(folder.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </td>
              <td className="py-2.5 px-3 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder(folder.id);
                  }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Eliminar carpeta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}

          {/* Files Rows */}
          {files.map((file) => {
            const isSelected = selectedFileIds.includes(file.id);

            return (
              <tr
                key={file.id}
                onClick={() => onOpenFilePreview(file)}
                className={`group hover:bg-neutral-50/80 dark:hover:bg-[#252525]/60 transition-colors cursor-pointer ${
                  isSelected ? 'bg-violet-50/70 dark:bg-violet-950/25' : ''
                }`}
              >
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectFile(file.id);
                    }}
                    className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#282828] hover:border-violet-500'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="p-1 rounded-md bg-neutral-100 dark:bg-[#282828] shrink-0">
                      {getFileCategoryIcon(file)}
                    </span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      {file.name}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 hidden md:table-cell">
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold">
                    {file.extension}
                  </span>
                </td>
                <td className="py-2.5 px-3 hidden sm:table-cell text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                  {FORMAT_FILE_SIZE(file.size)}
                </td>
                <td className="py-2.5 px-3 hidden lg:table-cell text-neutral-400 font-mono text-[11px]">
                  {new Date(file.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStarFile(file.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        file.isStarred
                          ? 'text-amber-500'
                          : 'text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a]'
                      }`}
                      title={file.isStarred ? 'Quitar de favoritos' : 'Favorito'}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadFile(file);
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                      title="Descargar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
