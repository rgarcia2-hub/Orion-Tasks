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
import { DriveContextMenu, ContextMenuTarget } from './DriveContextMenu';
import { DriveRenameModal } from './DriveRenameModal';
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
import { useCalendar } from '../../context/CalendarContext';
import { OrionAppSwitcher } from '../OrionAppSwitcher';
import {
  UploadCloud,
  FolderOpen,
  Trash2,
  FileQuestion,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Lock,
  Cloud,
  ShieldCheck,
  HardDrive,
  AlertCircle,
  Loader2,
  ArrowRight,
  Plus,
} from 'lucide-react';

export const OrionDriveApp: React.FC = () => {
  const {
    user,
    loginWithGoogle,
    isLoadingGoogle,
    googleSyncError,
    setCurrentApp,
    setUnauthorizedDomainForModal,
  } = useCalendar();

  // Load saved state or start completely empty
  const [folders, setFolders] = useState<DriveFolder[]>(() => {
    if (!user) return [];
    try {
      const saved = localStorage.getItem(`orion_drive_folders_v3_${user.uid}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FOLDERS;
  });

  const [files, setFiles] = useState<DriveFile[]>(() => {
    if (!user) return [];
    try {
      const saved = localStorage.getItem(`orion_drive_files_v3_${user.uid}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FILES;
  });

  // Re-sync whenever user account switches or logs in
  useEffect(() => {
    if (!user) {
      setFolders([]);
      setFiles([]);
      return;
    }
    try {
      const savedFolders = localStorage.getItem(`orion_drive_folders_v3_${user.uid}`);
      setFolders(savedFolders ? JSON.parse(savedFolders) : INITIAL_FOLDERS);
    } catch {
      setFolders(INITIAL_FOLDERS);
    }
    try {
      const savedFiles = localStorage.getItem(`orion_drive_files_v3_${user.uid}`);
      setFiles(savedFiles ? JSON.parse(savedFiles) : INITIAL_FILES);
    } catch {
      setFiles(INITIAL_FILES);
    }
  }, [user?.uid]);

  // Save changes isolated per user
  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`orion_drive_folders_v3_${user.uid}`, JSON.stringify(folders));
    } catch {}
  }, [folders, user?.uid]);

  useEffect(() => {
    if (!user) return;
    try {
      localStorage.setItem(`orion_drive_files_v3_${user.uid}`, JSON.stringify(files));
    } catch {}
  }, [files, user?.uid]);

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

  // Context Menu & Rename state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    target: ContextMenuTarget;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    target: { type: 'canvas' },
  });

  const [renameTarget, setRenameTarget] = useState<
    | { type: 'file'; item: DriveFile }
    | { type: 'folder'; item: DriveFolder }
    | null
  >(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

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

  const handleRestoreFolder = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isTrash: false } : f))
    );
    showToast('Carpeta restaurada.');
  };

  const handlePermanentDeleteFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    showToast('Archivo eliminado definitivamente.');
  };

  const handlePermanentDeleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setFiles((prev) => prev.filter((f) => f.folderId !== folderId));
    showToast('Carpeta eliminada definitivamente.');
  };

  // Context Menu triggers
  const handleContextMenuFolder = (e: React.MouseEvent, folder: DriveFolder) => {
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      target: { type: 'folder', folder },
    });
  };

  const handleContextMenuFile = (e: React.MouseEvent, file: DriveFile) => {
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      target: { type: 'file', file },
    });
  };

  const handleContextMenuCanvas = (e: React.MouseEvent) => {
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      target: { type: 'canvas' },
    });
  };

  // Rename actions
  const handleInitiateRenameFile = (file: DriveFile) => {
    setRenameTarget({ type: 'file', item: file });
    setIsRenameModalOpen(true);
  };

  const handleInitiateRenameFolder = (folder: DriveFolder) => {
    setRenameTarget({ type: 'folder', item: folder });
    setIsRenameModalOpen(true);
  };

  const handleExecuteRename = (newName: string) => {
    if (!renameTarget) return;

    if (renameTarget.type === 'file') {
      const fileId = renameTarget.item.id;
      const extension = newName.includes('.')
        ? newName.split('.').pop()?.toLowerCase() || renameTarget.item.extension
        : renameTarget.item.extension;
      const fullFileName = newName.includes('.') ? newName : `${newName}.${extension}`;
      const category = GET_FILE_CATEGORY(fullFileName);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                name: fullFileName,
                extension,
                category,
                updatedAt: new Date().toISOString(),
              }
            : f
        )
      );
      showToast(`Archivo renombrado a "${fullFileName}".`);
    } else {
      const folderId = renameTarget.item.id;
      setFolders((prev) =>
        prev.map((f) =>
          f.id === folderId
            ? { ...f, name: newName, updatedAt: new Date().toISOString() }
            : f
        )
      );
      showToast(`Carpeta renombrada a "${newName}".`);
    }
  };

  const handleChangeFolderColor = (folderId: string, color: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, color, updatedAt: new Date().toISOString() } : f))
    );
    showToast('Color de carpeta actualizado.');
  };

  const handleCopyLink = async (file: DriveFile) => {
    try {
      if (file.dataUrl) {
        await navigator.clipboard.writeText(file.dataUrl);
      } else {
        await navigator.clipboard.writeText(
          `https://orionworkspace.vercel.app/drive/share/${file.id}?name=${encodeURIComponent(file.name)}`
        );
      }
      showToast(`Enlace de "${file.name}" copiado al portapapeles.`);
    } catch {
      showToast(`Nombre de "${file.name}" copiado.`);
    }
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

  // Auth Gate: Orion Drive requires mandatory sign-in and starts empty
  if (!user) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#fbfbfa] dark:bg-[#151515] text-neutral-900 dark:text-neutral-100 overflow-hidden relative selection:bg-violet-500/30">
        {/* Top Minimal Bar */}
        <header className="h-14 border-b border-[#e9e9e7] dark:border-[#272727] bg-white/95 dark:bg-[#1c1c1c]/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none z-20">
          <div className="flex items-center gap-3">
            <OrionAppSwitcher currentAppName="drive" />
            <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              <HardDrive className="w-4 h-4 text-violet-500" />
              <span>Orion Drive</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20 font-medium">
                Cloud Storage
              </span>
            </div>
          </div>

          <button
            onClick={() => setCurrentApp('hub')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#252525] border border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Hub</span>
          </button>
        </header>

        {/* Main Auth Gate Body */}
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto">
          {/* Ambient space glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-md w-full bg-white dark:bg-[#1c1c1c] rounded-3xl p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-2xl relative z-10"
          >
            {/* Icon Badge */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-violet-500/25">
                  <HardDrive className="w-8 h-8" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white dark:bg-[#1c1c1c] p-0.5 shadow-xs">
                  <div className="w-full h-full rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Lock className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-800/60 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-500" />
                <span>Inicio de Sesión Requerido</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Bienvenido a Orion Drive
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">
                Para garantizar la privacidad y seguridad de tu almacenamiento en la nube, es obligatorio iniciar sesión. Comenzarás con una unidad totalmente limpia y vacía.
              </p>
            </div>

            {/* Value props list */}
            <div className="space-y-2.5 mb-6 bg-neutral-50/80 dark:bg-[#232323]/80 p-3.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/80">
              <div className="flex items-start gap-2.5 text-xs">
                <Sparkles className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
                <div className="text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">Nube vacía al iniciar:</span> 0 B usados y sin archivos mock. Todo lo que subas será tuyo.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Cloud className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">100 GB de capacidad:</span> Almacena y visualiza imágenes, PDF, código y vídeos.
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-neutral-700 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">Aislamiento por cuenta:</span> Tus carpetas y documentos quedan vinculados únicamente a tu usuario.
                </div>
              </div>
            </div>

            {/* Error banner */}
            {googleSyncError && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{googleSyncError}</p>
                  {googleSyncError.includes('unauthorized domain') && (
                    <button
                      onClick={() => setUnauthorizedDomainForModal(window.location.hostname)}
                      className="underline text-[11px] font-medium hover:opacity-80 block text-left cursor-pointer"
                    >
                      Ver instrucciones para autorizar dominio en Firebase
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={loginWithGoogle}
                disabled={isLoadingGoogle}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {isLoadingGoogle ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                    <span>Conectando con Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.44 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.14-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.1z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.28 2.56 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
                      />
                    </svg>
                    <span>Iniciar sesión con Google</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentApp('hub')}
                className="w-full py-2.5 px-4 rounded-xl text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xs font-medium hover:bg-neutral-100 dark:hover:bg-[#252525] transition-colors cursor-pointer text-center"
              >
                Volver a Orion Workspace Hub
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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

        {/* Mobile Horizontal Section Tabs (< md) */}
        <div className="flex md:hidden items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#1c1c1c] border-b border-[#e9e9e7] dark:border-[#272727] overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all' as const, label: 'Mi Unidad' },
            { id: 'recents' as const, label: 'Recientes' },
            { id: 'starred' as const, label: 'Destacados' },
            { id: 'trash' as const, label: 'Papelera' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => {
                setCurrentSection(sec.id);
                setCurrentFolderId(null);
                setSelectedFileIds([]);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                currentSection === sec.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-neutral-100 dark:bg-[#252525] text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <main
          onContextMenu={(e) => {
            e.preventDefault();
            handleContextMenuCanvas(e);
          }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-24 md:pb-6"
        >
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
                    : 'Haz clic derecho o arrastra archivos aquí para empezar a organizar tu nube.'}
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
              onContextMenuFolder={handleContextMenuFolder}
              onContextMenuFile={handleContextMenuFile}
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
              onContextMenuFolder={handleContextMenuFolder}
              onContextMenuFile={handleContextMenuFile}
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

      {/* Custom Context Menu */}
      <DriveContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        target={contextMenu.target}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        onOpenFilePreview={setPreviewFile}
        onDownloadFile={handleDownloadFile}
        onToggleStarFile={handleToggleStarFile}
        onDeleteFile={handleDeleteFile}
        onRestoreFile={handleRestoreFromTrash}
        onPermanentDeleteFile={handlePermanentDeleteFile}
        onRenameFile={handleInitiateRenameFile}
        onCopyLink={handleCopyLink}
        onOpenFolder={handleOpenFolder}
        onToggleStarFolder={handleToggleStarFolder}
        onDeleteFolder={handleDeleteFolder}
        onRestoreFolder={handleRestoreFolder}
        onPermanentDeleteFolder={handlePermanentDeleteFolder}
        onRenameFolder={handleInitiateRenameFolder}
        onChangeFolderColor={handleChangeFolderColor}
        onNewFolder={() => setIsNewFolderOpen(true)}
        onUploadFile={() => fileInputRef.current?.click()}
        onToggleViewMode={setViewMode}
        viewMode={viewMode}
        onSortChange={setSortField}
        sortField={sortField}
        onOpenStorage={() => setIsStorageOpen(true)}
        onSelectAll={handleSelectAll}
        isTrashSection={currentSection === 'trash'}
      />

      {/* Rename File / Folder Modal */}
      <DriveRenameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        target={renameTarget}
        onRename={handleExecuteRename}
      />

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 z-30 md:hidden flex flex-col items-end gap-2.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          title="Subir archivo desde el móvil"
          aria-label="Subir archivo"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

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
