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

export const INITIAL_FOLDERS: DriveFolder[] = [];

export const INITIAL_FILES: DriveFile[] = [];

