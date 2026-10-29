import React from 'react';
import { motion } from 'motion/react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronRight,
  HardDrive,
  Home,
  Trash2,
  Download,
  Star,
  CheckSquare,
  Square,
  Sparkles,
  ArrowLeft,
  Grid,
} from 'lucide-react';
import { OrionAppSwitcher } from '../OrionAppSwitcher';
import { useCalendar } from '../../context/CalendarContext';
import {
  DriveViewMode,
  DriveSortField,
  DriveSortOrder,
  DriveFolder,
  DriveViewSection,
} from './DriveTypes';

interface DriveToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: DriveViewMode;
  onToggleViewMode: (mode: DriveViewMode) => void;
  sortField: DriveSortField;
  sortOrder: DriveSortOrder;
  onSortChange: (field: DriveSortField) => void;
  onToggleSortOrder: () => void;
  currentFolderId: string | null;
  folders: DriveFolder[];
  onNavigateToFolder: (folderId: string | null) => void;
  currentSection: DriveViewSection;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onStarSelected: () => void;
  onDownloadSelected: () => void;
  isAllSelected: boolean;
}

export const DriveToolbar: React.FC<DriveToolbarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onToggleViewMode,
  sortField,
  sortOrder,
  onSortChange,
  onToggleSortOrder,
  currentFolderId,
  folders,
  onNavigateToFolder,
  currentSection,
  selectedCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onStarSelected,
  onDownloadSelected,
  isAllSelected,
}) => {
  const { setCurrentApp } = useCalendar();

  // Compute folder hierarchy breadcrumb path
  const breadcrumbPath: { id: string | null; name: string }[] = [];
  if (currentSection === 'all') {
    breadcrumbPath.push({ id: null, name: 'Mi Unidad' });
    let curr = folders.find((f) => f.id === currentFolderId);
    const chain: { id: string; name: string }[] = [];
    while (curr) {
      chain.unshift({ id: curr.id, name: curr.name });
      curr = folders.find((f) => f.id === curr?.parentId);
    }
    breadcrumbPath.push(...chain);
  } else {
    const titles: Record<DriveViewSection, string> = {
      all: 'Mi Unidad',
      recents: 'Archivos Recientes',
      starred: 'Elementos Destacados',
      shared: 'Compartidos Conmigo',
      trash: 'Papelera de Reciclaje',
    };
    breadcrumbPath.push({ id: null, name: titles[currentSection] });
  }

  return (
    <header className="h-14 border-b border-[#e9e9e7] dark:border-[#272727] bg-white/95 dark:bg-[#1c1c1c]/95 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0 select-none z-20">
      {/* Left: App Switcher + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <OrionAppSwitcher currentAppName="drive" />

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block shrink-0" />

        {/* Breadcrumb Bar */}
        <nav className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar py-1">
          {breadcrumbPath.map((item, index) => {
            const isLast = index === breadcrumbPath.length - 1;
            return (
              <React.Fragment key={item.id ?? 'root'}>
                {index > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 shrink-0" />
                )}
                <button
                  onClick={() => onNavigateToFolder(item.id)}
                  disabled={isLast}
                  className={`truncate font-medium transition-colors cursor-pointer max-w-[140px] sm:max-w-[200px] ${
                    isLast
                      ? 'text-neutral-900 dark:text-white font-semibold cursor-default'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                  }`}
                  title={item.name}
                >
                  {index === 0 && currentSection === 'all' && (
                    <span className="inline-flex items-center gap-1">
                      <Home className="w-3 h-3 inline text-violet-500 shrink-0" />
                      <span>{item.name}</span>
                    </span>
                  )}
                  {!(index === 0 && currentSection === 'all') && item.name}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Middle: Live Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-2">
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar archivos por nombre, etiqueta o tipo..."
            className="w-full pl-8.5 pr-8 py-1.5 rounded-xl bg-neutral-100/90 dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-700/60 text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Bulk actions or View Mode & Sort */}
      <div className="flex items-center gap-2 shrink-0">
        {selectedCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 rounded-xl px-2.5 py-1"
          >
            <span className="text-xs font-semibold text-violet-900 dark:text-violet-200 font-mono mr-1">
              {selectedCount} sel.
            </span>
            <button
              onClick={onDownloadSelected}
              className="p-1 rounded-lg text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 transition-colors cursor-pointer"
              title="Descargar seleccionados"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onStarSelected}
              className="p-1 rounded-lg text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/60 transition-colors cursor-pointer"
              title="Destacar seleccionados"
            >
              <Star className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDeleteSelected}
              className="p-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
              title="Mover a papelera"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-violet-200 dark:bg-violet-800" />
            <button
              onClick={onClearSelection}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-[10px] font-medium"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ) : (
          <>
            {/* Sort Field Selector */}
            <div className="flex items-center border border-neutral-200 dark:border-neutral-700/80 rounded-xl overflow-hidden bg-neutral-50/70 dark:bg-[#232323]">
              <select
                value={sortField}
                onChange={(e) => onSortChange(e.target.value as DriveSortField)}
                className="bg-transparent text-[11px] font-medium text-neutral-700 dark:text-neutral-300 px-2 py-1.5 focus:outline-none cursor-pointer"
                title="Ordenar por"
              >
                <option value="date" className="dark:bg-[#202020]">Fecha</option>
                <option value="name" className="dark:bg-[#202020]">Nombre</option>
                <option value="size" className="dark:bg-[#202020]">Tamaño</option>
                <option value="type" className="dark:bg-[#202020]">Tipo</option>
              </select>
              <button
                onClick={onToggleSortOrder}
                className="px-1.5 py-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 border-l border-neutral-200 dark:border-neutral-700/80 transition-colors cursor-pointer"
                title={`Orden ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}`}
              >
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>

            {/* View Mode Switcher (Grid vs List) */}
            <div className="flex items-center p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-100/60 dark:bg-[#232323]">
              <button
                onClick={() => onToggleViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-[#2e2e2e] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
                title="Vista de cuadrícula"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onToggleViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#2e2e2e] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
                title="Vista de lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* Back to Hub shortcut button */}
        <button
          onClick={() => setCurrentApp('hub')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#252525] border border-neutral-200/60 dark:border-neutral-800 transition-colors cursor-pointer"
          title="Volver a Orion Workspace Hub"
        >
          <span>Hub</span>
        </button>
      </div>
    </header>
  );
};
