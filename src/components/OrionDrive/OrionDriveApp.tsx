import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DriveSidebar } from './DriveSidebar';
import { DriveToolbar } from './DriveToolbar';
import { DriveFileGrid } from './DriveFileGrid';
import { DriveFileList } from './DriveFileList';
import { DriveFilePreviewModal } from './DriveFilePreviewModal';
import { DriveNewFolderModal } from './DriveNewFolderModal';
import { DriveStorageModal } from './DriveStorageModal';
import {
  DriveFile,
  DriveFolder,
  DriveViewSection,
  DriveFilterCategory,
  DriveViewMode,
  DriveSortField,
  DriveSortOrder,
  INITIAL_FILES,
  INITIAL_FOLDERS,
  GET_FILE_CATEGORY,
} from './DriveTypes';
import {
  UploadCloud,
  FolderOpen,
  Trash2,
  FileQuestion,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

const STORAGE_KEY_FILES = 'orion_drive_files_v2';
const STORAGE_KEY_FOLDERS = 'orion_drive_folders_v2';

export const OrionDriveApp: React.FC = () => {
  // Load saved state or initial mock seed
  const [folders, setFolders] = useState<DriveFolder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FOLDERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FOLDERS;
  });

  const [files, setFiles] = useState<DriveFile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FILES;
  });

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    } catch {}
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
    } catch {}
  }, [files]);

  // Navigation & Filtering
  const [currentSection, setCurrentSection] = useState<DriveViewSection>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DriveFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<DriveViewMode>('grid');
  const [sortField, setSortField] = useState<DriveSortField>('date');
  const [sortOrder, setSortOrder] = useState<DriveSortOrder>('desc');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Drag & drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Switch folder navigation
  const handleOpenFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedCategory('all');
    setSelectedFileIds([]);
  };

  const handleNavigateToBreadcrumb = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSelectedCategory('all');
    setSelectedFileIds([]);
  };

  // Create folder
  const handleCreateFolder = (name: string, color: string) => {
    const newFolder: DriveFolder = {
      id: 'folder-' + Date.now(),
      name,
      parentId: currentSection === 'all' ? currentFolderId : null,
      color,
      isStarred: false,
      isTrash: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFolders((prev) => [newFolder, ...prev]);
    showToast(`Carpeta "${name}" creada con éxito.`);
  };

  // File Upload Handlers (Real HTML5 file upload)
  const processUploadedFiles = async (fileList: FileList) => {
    setIsUploading(true);
    const newFiles: DriveFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const extension = f.name.split('.').pop()?.toLowerCase() || '';
      const category = GET_FILE_CATEGORY(f.name);

      let dataUrl: string | undefined = undefined;
      let textContent: string | undefined = undefined;

      try {
        if (f.type.startsWith('image/')) {
          dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(f);
          });
        } else if (
          f.type.startsWith('text/') ||
          ['ts', 'tsx', 'js', 'json', 'md', 'csv', 'txt'].includes(extension)
        ) {
          textContent = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(f);
          });
        }
      } catch (e) {
        console.warn('Error reading file data:', e);
      }

      newFiles.push({
        id: 'file-' + Date.now() + '-' + i,
        name: f.name,
        folderId: currentSection === 'all' ? currentFolderId : null,
        size: f.size,
        extension,
        category,
        mimeType: f.type || 'application/octet-stream',
        dataUrl,
        textContent,
        isStarred: false,
        isTrash: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Tú',
      });
    }

    setFiles((prev) => [...newFiles, ...prev]);
    setIsUploading(false);
    showToast(`${newFiles.length} ${newFiles.length === 1 ? 'archivo subido' : 'archivos subidos'} a Orion Drive.`);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFiles(e.target.files);
    }
  };

  // Drag & drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  // Real browser file download
  const handleDownloadFile = (file: DriveFile) => {
    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (file.textContent) {
      const blob = new Blob([file.textContent], { type: file.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Fallback synthetic file
      const blob = new Blob([`Orion Drive: ${file.name}\nTamaño: ${file.size} bytes`], {
        type: 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    showToast(`Descargando "${file.name}"...`);
  };

  // Star / Unstar
  const handleToggleStarFile = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isStarred: !f.isStarred } : f))
    );
  };

  const handleToggleStarFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isStarred: !f.isStarred } : f))
    );
  };

  // Delete / Trash
  const handleDeleteFile = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        if (f.isTrash) return f; // already in trash
        return { ...f, isTrash: true };
      })
    );
    showToast('Archivo movido a la papelera.');
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => {
        if (f.id !== folderId) return f;
        return { ...f, isTrash: true };
      })
    );
    showToast('Carpeta movida a la papelera.');
  };

  const handleEmptyTrash = () => {
    setFiles((prev) => prev.filter((f) => !f.isTrash));
    setFolders((prev) => prev.filter((f) => !f.isTrash));
    showToast('Papelera vaciada.');
  };

  const handleRestoreFromTrash = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isTrash: false } : f))
    );
    showToast('Elemento restaurado.');
  };

  // Bulk operations
  const handleToggleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f) => f.id));
    }
  };

  const handleDeleteSelected = () => {
    setFiles((prev) =>
      prev.map((f) => (selectedFileIds.includes(f.id) ? { ...f, isTrash: true } : f))
    );
    showToast(`${selectedFileIds.length} elementos movidos a la papelera.`);
    setSelectedFileIds([]);
  };

  const handleStarSelected = () => {
    setFiles((prev) =>
      prev.map((f) => (selectedFileIds.includes(f.id) ? { ...f, isStarred: true } : f))
    );
    showToast(`${selectedFileIds.length} elementos marcados como favoritos.`);
    setSelectedFileIds([]);
  };

  const handleDownloadSelected = () => {
    selectedFileIds.forEach((id) => {
      const f = files.find((item) => item.id === id);
      if (f) handleDownloadFile(f);
    });
  };

  // Filter and sort items
  const filteredFolders = useMemo(() => {
    if (searchQuery.trim()) {
      return folders.filter(
        (f) =>
          !f.isTrash &&
          f.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    if (currentSection === 'trash') {
      return folders.filter((f) => f.isTrash);
    }

    if (currentSection === 'starred') {
      return folders.filter((f) => !f.isTrash && f.isStarred);
    }

    if (currentSection === 'recents' || currentSection === 'shared') {
      return []; // Only files shown in recents/shared
    }

    // Default 'all' section: only show folders in currentFolderId
    return folders.filter((f) => !f.isTrash && f.parentId === currentFolderId);
  }, [folders, currentSection, currentFolderId, searchQuery]);

  const filteredFiles = useMemo(() => {
    let result = files;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return result.filter(
        (f) =>
          !f.isTrash &&
          (f.name.toLowerCase().includes(q) ||
            f.extension.toLowerCase().includes(q) ||
            f.tags?.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Section filter
    if (currentSection === 'trash') {
      result = result.filter((f) => f.isTrash);
    } else if (currentSection === 'starred') {
      result = result.filter((f) => !f.isTrash && f.isStarred);
    } else if (currentSection === 'recents') {
      result = result.filter((f) => !f.isTrash);
    } else if (currentSection === 'shared') {
      result = result.filter((f) => !f.isTrash && f.sharedWith && f.sharedWith.length > 0);
    } else {
      // 'all' section
      result = result.filter((f) => !f.isTrash && f.folderId === currentFolderId);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((f) => f.category === selectedCategory);
    }

    // Sort
    return [...result].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'size') {
        comparison = a.size - b.size;
      } else if (sortField === 'type') {
        comparison = a.extension.localeCompare(b.extension);
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [files, currentSection, currentFolderId, selectedCategory, searchQuery, sortField, sortOrder]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-screen w-full bg-[#fbfbfa] dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans"
    >
      {/* Hidden file input for native file browser dialog */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drag & Drop Visual Glow Overlay */}
      <AnimatePresence>
        {isDraggingOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-violet-600/20 backdrop-blur-sm border-4 border-dashed border-violet-500 rounded-2xl m-3 flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1], y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="p-5 rounded-3xl bg-white dark:bg-[#202020] text-violet-600 dark:text-violet-400 shadow-2xl flex flex-col items-center gap-3"
            >
              <UploadCloud className="w-12 h-12" />
              <div className="text-center">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Suelta tus archivos aquí
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Se subirán automáticamente a {currentFolderId ? 'la carpeta actual' : 'Mi Unidad'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <DriveSidebar
        currentSection={currentSection}
        onSelectSection={(sec) => {
          setCurrentSection(sec);
          setCurrentFolderId(null);
          setSelectedFileIds([]);
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onOpenNewFolder={() => setIsNewFolderOpen(true)}
        onTriggerFileUpload={() => fileInputRef.current?.click()}
        onOpenStorageInfo={() => setIsStorageOpen(true)}
        files={files}
        folders={folders}
        isUploading={isUploading}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header / Toolbar */}
        <DriveToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onToggleViewMode={setViewMode}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={setSortField}
          onToggleSortOrder={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          currentFolderId={currentFolderId}
          folders={folders}
          onNavigateToFolder={handleNavigateToBreadcrumb}
          currentSection={currentSection}
          selectedCount={selectedFileIds.length}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedFileIds([])}
          onDeleteSelected={handleDeleteSelected}
          onStarSelected={handleStarSelected}
          onDownloadSelected={handleDownloadSelected}
          isAllSelected={
            filteredFiles.length > 0 && selectedFileIds.length === filteredFiles.length
          }
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Trash Top Notice */}
          {currentSection === 'trash' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Los elementos en la papelera no se borrarán definitivamente hasta que vacíes la papelera.
                </span>
              </div>
              <button
                onClick={handleEmptyTrash}
                disabled={filteredFiles.length === 0 && filteredFolders.length === 0}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                Vaciar papelera
              </button>
            </div>
          )}

          {/* Empty States */}
          {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-neutral-100 dark:bg-[#232323] text-neutral-400 flex items-center justify-center shadow-inner">
                {currentSection === 'trash' ? (
                  <Trash2 className="w-8 h-8" />
                ) : searchQuery ? (
                  <FileQuestion className="w-8 h-8" />
                ) : (
                  <FolderOpen className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  {searchQuery
                    ? `Sin resultados para "${searchQuery}"`
                    : currentSection === 'trash'
                    ? 'La papelera está vacía'
                    : currentSection === 'starred'
                    ? 'No tienes elementos destacados'
                    : 'Esta carpeta está vacía'}
                </h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-sm mt-1">
                  {currentSection === 'trash'
                    ? 'Los elementos que elimines aparecerán aquí temporalmente.'
                    : 'Arrastra archivos aquí o pulsa el botón "Subir" para empezar a organizar tu nube.'}
                </p>
              </div>

              {currentSection !== 'trash' && !searchQuery && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Subir primer archivo
                  </button>
                  <button
                    onClick={() => setIsNewFolderOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-[#252525] hover:bg-neutral-200 dark:hover:bg-[#2c2c2c] text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-200 dark:border-neutral-700/80 transition-colors cursor-pointer"
                  >
                    Crear carpeta
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <DriveFileGrid
              folders={filteredFolders}
              files={filteredFiles}
              onOpenFolder={handleOpenFolder}
              onOpenFilePreview={setPreviewFile}
              onToggleStarFile={handleToggleStarFile}
              onToggleStarFolder={handleToggleStarFolder}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={handleDeleteFolder}
              onDownloadFile={handleDownloadFile}
              selectedFileIds={selectedFileIds}
              onToggleSelectFile={handleToggleSelectFile}
            />
          ) : (
            <DriveFileList
              folders={filteredFolders}
              files={filteredFiles}
              onOpenFolder={handleOpenFolder}
              onOpenFilePreview={setPreviewFile}
              onToggleStarFile={handleToggleStarFile}
              onToggleStarFolder={handleToggleStarFolder}
              onDeleteFile={handleDeleteFile}
              onDeleteFolder={handleDeleteFolder}
              onDownloadFile={handleDownloadFile}
              selectedFileIds={selectedFileIds}
              onToggleSelectFile={handleToggleSelectFile}
              onSelectAll={handleSelectAll}
              isAllSelected={
                filteredFiles.length > 0 && selectedFileIds.length === filteredFiles.length
              }
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <DriveFilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onToggleStar={handleToggleStarFile}
        onDeleteFile={handleDeleteFile}
        onDownloadFile={handleDownloadFile}
      />

      <DriveNewFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      <DriveStorageModal
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        files={files}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* Floating Micro-Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold shadow-xl flex items-center gap-2 border border-neutral-700/50"
          >
            <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
