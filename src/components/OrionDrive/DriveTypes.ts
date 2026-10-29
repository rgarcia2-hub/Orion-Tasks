export type FileCategory = 'document' | 'image' | 'code' | 'media' | 'data' | 'archive' | 'other';

export interface DriveFolder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  isStarred?: boolean;
  isTrash?: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export interface DriveFile {
  id: string;
  name: string;
  folderId: string | null;
  size: number; // in bytes
  extension: string;
  category: FileCategory;
  mimeType: string;
  dataUrl?: string;
  textContent?: string;
  isStarred?: boolean;
  isTrash?: boolean;
  tags?: string[];
  sharedWith?: string[];
  createdAt: string;
  updatedAt: string;
  author?: string;
}

export type DriveViewSection = 'all' | 'recents' | 'starred' | 'shared' | 'trash';
export type DriveFilterCategory = 'all' | FileCategory;
export type DriveViewMode = 'grid' | 'list';
export type DriveSortField = 'name' | 'date' | 'size' | 'type';
export type DriveSortOrder = 'asc' | 'desc';

export const FORMAT_FILE_SIZE = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const GET_FILE_CATEGORY = (filename: string): FileCategory => {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext)) return 'image';
  if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'pages'].includes(ext)) return 'document';
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'py', 'sh', 'rs', 'go', 'md'].includes(ext)) return 'code';
  if (['csv', 'xlsx', 'xls', 'sql'].includes(ext)) return 'data';
  if (['mp3', 'wav', 'ogg', 'mp4', 'mov', 'webm', 'm4a'].includes(ext)) return 'media';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'archive';
  return 'other';
};

export const INITIAL_FOLDERS: DriveFolder[] = [
  {
    id: 'folder-projects',
    name: 'Proyectos Orion',
    parentId: null,
    color: '#6366F1', // Indigo
    isStarred: true,
    isTrash: false,
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-10-24T14:30:00Z',
  },
  {
    id: 'folder-assets',
    name: 'Diseño & Assets Visuales',
    parentId: null,
    color: '#EC4899', // Pink
    isStarred: false,
    isTrash: false,
    createdAt: '2026-09-20T08:15:00Z',
    updatedAt: '2026-10-28T09:20:00Z',
  },
  {
    id: 'folder-code',
    name: 'Arquitectura & Configuración',
    parentId: null,
    color: '#10B981', // Emerald
    isStarred: true,
    isTrash: false,
    createdAt: '2026-10-01T11:45:00Z',
    updatedAt: '2026-10-29T08:00:00Z',
  },
  {
    id: 'folder-finance',
    name: 'Métricas & Informes Q4',
    parentId: null,
    color: '#F59E0B', // Amber
    isStarred: false,
    isTrash: false,
    createdAt: '2026-10-10T16:20:00Z',
    updatedAt: '2026-10-27T17:10:00Z',
  },
  {
    id: 'folder-sub-ui',
    name: 'Mockups UI & Iconos',
    parentId: 'folder-assets',
    color: '#8B5CF6', // Violet
    isStarred: false,
    isTrash: false,
    createdAt: '2026-10-12T12:00:00Z',
    updatedAt: '2026-10-28T11:00:00Z',
  },
];

export const INITIAL_FILES: DriveFile[] = [
  {
    id: 'file-1',
    name: 'Orion-OS-Design-Spec-v2.4.pdf',
    folderId: 'folder-projects',
    size: 4423680, // 4.2 MB
    extension: 'pdf',
    category: 'document',
    mimeType: 'application/pdf',
    isStarred: true,
    isTrash: false,
    tags: ['Diseño', 'Especificaciones', 'v2.4'],
    author: 'Equipo Orion Core',
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-27T15:30:00Z',
    textContent: `# Especificación de Diseño Orion OS v2.4

## Filosofía del Sistema
Orion OS integra un ecosistema de productividad unificado con estética glassmorphic espacial, contraste equilibrado, y rendimiento instantáneo.

### Principios Fundamentales:
1. **Disciplina Zero-Pill**: Botones y componentes enraizados en una jerarquía visual estructurada sin cápsulas flotantes genéricas.
2. **Atmósfera Espacial Dinámica**: Iluminación cósmica sutil (#6366f1, #8b5cf6, #fef08a) que responde a las acciones del usuario.
3. **Persistencia Híbrida**: Almacenamiento local optimizado con sincronización en la nube vía Google Account y Firestore.
4. **Respuesta Táctil & Animaciones**: Transiciones de entrada con física elástica y micro-interacciones de 200-300ms.

### Paleta de Colores Orion:
- Fondo primario: #191919 / #fbfbfa
- Paneles elevados: #242424 / #ffffff
- Borde sutil: #2e2e2e / #e9e9e7
- Acento Starlight: #FEF08A`,
  },
  {
    id: 'file-2',
    name: 'orion-nebula-wallpaper.png',
    folderId: 'folder-assets',
    size: 2936012, // 2.8 MB
    extension: 'png',
    category: 'image',
    mimeType: 'image/png',
    isStarred: true,
    isTrash: false,
    tags: ['Wallpaper', 'Fondo', 'Nebula'],
    author: 'Orion Art Lab',
    createdAt: '2026-10-20T14:15:00Z',
    updatedAt: '2026-10-25T18:40:00Z',
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230b0f19"/><stop offset="50%" stop-color="%231e1145"/><stop offset="100%" stop-color="%23071329"/></linearGradient><radialGradient id="g2" cx="60%" cy="40%" r="50%"><stop offset="0%" stop-color="%238b5cf6" stop-opacity="0.7"/><stop offset="50%" stop-color="%23ec4899" stop-opacity="0.3"/><stop offset="100%" stop-color="%230b0f19" stop-opacity="0"/></radialGradient><radialGradient id="g3" cx="30%" cy="70%" r="40%"><stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.6"/><stop offset="100%" stop-color="%230b0f19" stop-opacity="0"/></radialGradient></defs><rect width="800" height="500" fill="url(%23g1)"/><rect width="800" height="500" fill="url(%23g2)"/><rect width="800" height="500" fill="url(%23g3)"/><circle cx="480" cy="200" r="1.5" fill="%23fff" opacity="0.9"/><circle cx="210" cy="120" r="2" fill="%23fff" opacity="0.8"/><circle cx="340" cy="380" r="1.5" fill="%23fef08a" opacity="0.9"/><circle cx="650" cy="310" r="2.5" fill="%23fff" opacity="0.95"/><circle cx="150" cy="290" r="1" fill="%23fff" opacity="0.6"/><text x="400" y="260" font-family="system-ui, sans-serif" font-weight="800" font-size="28" fill="%23ffffff" text-anchor="middle" letter-spacing="4">ORION NEBULA</text><text x="400" y="295" font-family="system-ui, sans-serif" font-weight="500" font-size="14" fill="%2394a3b8" text-anchor="middle" letter-spacing="2">DEEP SPACE AMBIENT CANVAS</text></svg>',
  },
  {
    id: 'file-3',
    name: 'kernel-config.json',
    folderId: 'folder-code',
    size: 8420, // 8.2 KB
    extension: 'json',
    category: 'code',
    mimeType: 'application/json',
    isStarred: false,
    isTrash: false,
    tags: ['Config', 'Kernel', 'JSON'],
    author: 'Sistema Orion',
    createdAt: '2026-10-22T09:30:00Z',
    updatedAt: '2026-10-29T07:15:00Z',
    textContent: `{
  "orion_os_version": "2.4.0",
  "kernel": {
    "architecture": "x86_64_reactive",
    "scheduler": "adaptive_motion_priority",
    "memory_tier": "quantum_cache",
    "sandbox_mode": true
  },
  "modules": [
    { "id": "orion-tasks", "enabled": true, "cache_size_mb": 64 },
    { "id": "orion-calendar", "enabled": true, "sync_interval_sec": 30 },
    { "id": "orion-mail", "enabled": true, "ai_scanner_glow": "#FEF08A" },
    { "id": "orion-drive", "enabled": true, "storage_quota_gb": 100 }
  ],
  "security": {
    "encryption": "AES-256-GCM",
    "auth_provider": "google_identity_services",
    "token_rotation_minutes": 60
  }
}`,
  },
  {
    id: 'file-4',
    name: 'metricas-q3-2026.csv',
    folderId: 'folder-finance',
    size: 184320, // 180 KB
    extension: 'csv',
    category: 'data',
    mimeType: 'text/csv',
    isStarred: false,
    isTrash: false,
    tags: ['Métricas', 'Finanzas', 'Q3'],
    author: 'Métricas Orion',
    createdAt: '2026-10-05T11:00:00Z',
    updatedAt: '2026-10-26T14:00:00Z',
    textContent: `Mes,Usuarios_Activos,Tareas_Completadas,Tasa_Retencion,Uptime_Percent,Almacenamiento_GB
Julio,14250,98420,94.2,99.98,4210
Agosto,18900,126300,95.8,99.99,5840
Septiembre,24300,165400,97.1,99.97,8190
Octubre (Est),31200,210000,98.4,100.0,11420`,
  },
  {
    id: 'file-5',
    name: 'OrionDriveComponent.tsx',
    folderId: 'folder-code',
    size: 42100, // 41 KB
    extension: 'tsx',
    category: 'code',
    mimeType: 'text/typescript',
    isStarred: true,
    isTrash: false,
    tags: ['React', 'TypeScript', 'Drive'],
    author: 'Ingeniería Orion',
    createdAt: '2026-10-25T16:00:00Z',
    updatedAt: '2026-10-29T08:10:00Z',
    textContent: `import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, Folder, File, Upload, Search } from 'lucide-react';

export const OrionDrive = () => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  return (
    <div className="flex h-full w-full bg-[#191919] text-white">
      {/* Orion Drive Native Cloud Explorer */}
    </div>
  );
};`,
  },
  {
    id: 'file-6',
    name: 'orion-ambient-space-lofi.mp3',
    folderId: null, // Root
    size: 8912896, // 8.5 MB
    extension: 'mp3',
    category: 'media',
    mimeType: 'audio/mpeg',
    isStarred: false,
    isTrash: false,
    tags: ['Audio', 'Lo-Fi', 'Música'],
    author: 'Orion Studio Sound',
    createdAt: '2026-10-15T20:00:00Z',
    updatedAt: '2026-10-22T19:00:00Z',
    textContent: 'Banda sonora ambiental de baja fidelidad para sesiones de concentración profunda en Orion Workspace.',
  },
  {
    id: 'file-7',
    name: 'README-Orion-Suite.md',
    folderId: null, // Root
    size: 15360, // 15 KB
    extension: 'md',
    category: 'document',
    mimeType: 'text/markdown',
    isStarred: true,
    isTrash: false,
    tags: ['Docs', 'Guía', 'Suite'],
    author: 'Orion Docs',
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-10-29T08:20:00Z',
    textContent: `# Bienvenido a Orion Workspace Suite

Orion es tu sistema operativo de productividad unificado en la nube.

### Aplicaciones Nativas Integradas:
1. **Orion Calendar**: Vistas fluidas de semana, mes y agenda con sincronización bidireccional de Google Calendar.
2. **Orion Tasks**: Flujo de trabajo ágil tipo Kanban con prioridades, hábitos y duplicación automática de eventos.
3. **Orion Mail**: Bandeja de correo moderna de 3 columnas conectada a Gmail y Firestore con escaneo e IA lumínica.
4. **Orion Drive**: Almacenamiento seguro en la nube, organizador de carpetas, previsualización interactiva de múltiples formatos y carga rápida por arrastrar y soltar.

---
*Diseñado con precisión estética para mentes enfocadas.*`,
  },
  {
    id: 'file-8',
    name: 'antiguo-borrador-deprecado.txt',
    folderId: null,
    size: 2048,
    extension: 'txt',
    category: 'document',
    mimeType: 'text/plain',
    isStarred: false,
    isTrash: true, // In Trash
    tags: ['Borrador'],
    author: 'Usuario',
    createdAt: '2026-08-14T09:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    textContent: 'Notas antiguas de la versión preliminar 1.0 ya descartadas.',
  },
];
