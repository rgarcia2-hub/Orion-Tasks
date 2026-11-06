import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Plus,
  Search,
  Copy,
  Check,
  Star,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Download,
  Key,
  Camera,
  RefreshCw,
  FolderOpen,
  Sparkles,
  Lock,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
} from 'lucide-react';
import { isBannerDismissed, dismissBannerPermanently } from '../../utils/dismissedNotifs';
import { useCalendar } from '../../context/CalendarContext';
import { OrionAppSwitcher } from '../OrionAppSwitcher';
import { GoogleAuthButton } from '../GoogleAuthButton';
import { AuthenticatorToken, GeneratedCodeInfo } from '../../types/authenticator';
import {
  AuthenticatorSecurityConfig,
  DEFAULT_SECURITY_CONFIG,
} from '../../types/authenticatorSecurity';
import { generateTotpCode, generateRandomSecret } from '../../utils/totp';
import { AuthenticatorIcon } from './AuthenticatorIcon';
import { AuthenticatorAddModal } from './AuthenticatorAddModal';
import { AuthenticatorEditModal } from './AuthenticatorEditModal';
import { AuthenticatorBackupModal } from './AuthenticatorBackupModal';
import { AuthenticatorSetupWizard } from './AuthenticatorSetupWizard';
import { AuthenticatorLockGate } from './AuthenticatorLockGate';
import { AuthenticatorSecuritySettingsModal } from './AuthenticatorSecuritySettingsModal';
import {
  subscribeToUserAuthenticatorTokens,
  saveAuthenticatorTokenToFirestore,
  deleteAuthenticatorTokenFromFirestore,
  batchSaveAuthenticatorTokensToFirestore,
  saveAuthenticatorSecuritySettings,
  subscribeToAuthenticatorSecuritySettings,
} from '../../services/firebase';

const LOCAL_STORAGE_KEY = 'orion_authenticator_tokens_v1';
const SECURITY_STORAGE_KEY = 'orion_authenticator_security_v1';

export const OrionAuthenticatorApp: React.FC = () => {
  const { user, loginWithGoogle, isLoadingGoogle } = useCalendar();

  // Security configuration state
  const [securityConfig, setSecurityConfig] = useState<AuthenticatorSecurityConfig>(() => {
    try {
      const saved = localStorage.getItem(SECURITY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SECURITY_CONFIG;
  });

  // Locked gate state (vault starts locked if configured)
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SECURITY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isConfigured);
      }
    } catch {}
    return false;
  });

  // Security modals state
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [isSecuritySettingsOpen, setIsSecuritySettingsOpen] = useState(false);
  const lastActiveTimestampRef = useRef<number>(Date.now());

  const [isCloudWarningDismissed, setIsCloudWarningDismissed] = useState<boolean>(() => {
    return isBannerDismissed('auth_cloud_local_warning', user?.uid || user?.email);
  });

  useEffect(() => {
    setIsCloudWarningDismissed(isBannerDismissed('auth_cloud_local_warning', user?.uid || user?.email));
  }, [user?.uid, user?.email]);

  // Tokens state
  const [tokens, setTokens] = useState<AuthenticatorToken[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Ticker timestamp (forces recalculation of TOTP codes every second)
  const [currentSeconds, setCurrentSeconds] = useState(Math.floor(Date.now() / 1000));

  // Modals & UI state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<AuthenticatorToken | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [revealedNextCodes, setRevealedNextCodes] = useState<Record<string, boolean>>({});
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Ticker loop: update every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSeconds(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Real-time Firestore Cloud Sync across devices
  useEffect(() => {
    if (!user) {
      setIsCloudSynced(false);
      return;
    }

    // Subscribe to user's tokens in Firestore
    const unsubscribe = subscribeToUserAuthenticatorTokens(
      user.uid,
      (cloudTokens) => {
        setIsCloudSynced(true);
        if (cloudTokens && cloudTokens.length > 0) {
          setTokens(cloudTokens);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudTokens));
          } catch {}
        } else {
          // If Firestore is empty, push any local tokens to cloud so they sync immediately
          try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (saved) {
              const localTokens: AuthenticatorToken[] = JSON.parse(saved);
              if (localTokens.length > 0) {
                batchSaveAuthenticatorTokensToFirestore(user.uid, localTokens);
              }
            }
          } catch {}
        }
      },
      (error) => {
        console.warn('Firestore Authenticator sync error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 2.1. Real-time Firestore Security Settings Sync across devices
  useEffect(() => {
    if (!user) return;

    const unsubSecurity = subscribeToAuthenticatorSecuritySettings(
      user.uid,
      (cloudConfig) => {
        if (cloudConfig) {
          setSecurityConfig(cloudConfig);
          try {
            localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(cloudConfig));
          } catch {}
          if (!cloudConfig.isConfigured) {
            setIsSetupWizardOpen(true);
          }
        } else {
          // If Firestore has no security config yet, check if local has one and sync to cloud
          try {
            const local = localStorage.getItem(SECURITY_STORAGE_KEY);
            if (local) {
              const parsed = JSON.parse(local);
              if (parsed.isConfigured) {
                saveAuthenticatorSecuritySettings(user.uid, parsed);
              }
            }
          } catch {}
        }
      },
      (error) => {
        console.warn('Firestore security settings sync warning:', error);
      }
    );

    return () => unsubSecurity();
  }, [user]);

  // 2.2. Prompt setup wizard on first entry if security is not configured
  useEffect(() => {
    if (!securityConfig.isConfigured) {
      setIsSetupWizardOpen(true);
    }
  }, [securityConfig.isConfigured]);

  // 2.3. Auto-lock on page visibility change or idle timeout
  useEffect(() => {
    if (!securityConfig.isConfigured) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lastActiveTimestampRef.current = Date.now();
        if (securityConfig.autoLockMinutes === 0) {
          setIsVaultLocked(true);
        }
      } else {
        const elapsedMinutes = (Date.now() - lastActiveTimestampRef.current) / 60000;
        if (securityConfig.autoLockMinutes > 0 && elapsedMinutes >= securityConfig.autoLockMinutes) {
          setIsVaultLocked(true);
        }
      }
    };

    const handleUserInteraction = () => {
      lastActiveTimestampRef.current = Date.now();
    };

    const interval = setInterval(() => {
      if (!isVaultLocked && securityConfig.autoLockMinutes > 0) {
        const elapsedMinutes = (Date.now() - lastActiveTimestampRef.current) / 60000;
        if (elapsedMinutes >= securityConfig.autoLockMinutes) {
          setIsVaultLocked(true);
        }
      }
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mousemove', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [securityConfig, isVaultLocked]);

  // Security handlers
  const handleSaveSecurityConfig = async (newConfig: AuthenticatorSecurityConfig) => {
    setSecurityConfig(newConfig);
    try {
      localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(newConfig));
    } catch {}

    if (user) {
      try {
        await saveAuthenticatorSecuritySettings(user.uid, newConfig);
      } catch (err) {
        console.error('Error saving security config to cloud:', err);
      }
    }
    showToast('Configuración de seguridad guardada.');
  };

  const handleSetupComplete = async (newConfig: AuthenticatorSecurityConfig) => {
    await handleSaveSecurityConfig(newConfig);
    setIsSetupWizardOpen(false);
    setIsVaultLocked(false);
    showToast('Bóveda configurada y protegida con éxito.');
  };

  const handleUnlockVault = (updatedConfig?: AuthenticatorSecurityConfig) => {
    if (updatedConfig) {
      handleSaveSecurityConfig(updatedConfig);
    }
    lastActiveTimestampRef.current = Date.now();
    setIsVaultLocked(false);
    showToast('Bóveda desbloqueada con éxito.');
  };

  // 3. Save local cache whenever tokens change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tokens));
    } catch {}
  }, [tokens]);

  // Compute live generated codes for all tokens
  const generatedCodes = useMemo(() => {
    const map: Record<string, GeneratedCodeInfo> = {};
    tokens.forEach((token) => {
      map[token.id] = generateTotpCode(token);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, currentSeconds]);

  // Available folders / categories
  const folders = useMemo(() => {
    const set = new Set<string>();
    tokens.forEach((t) => {
      if (t.folder) set.add(t.folder);
    });
    return Array.from(set);
  }, [tokens]);

  // Filtered tokens
  const filteredTokens = useMemo(() => {
    return tokens
      .filter((t) => {
        if (selectedFolder !== 'all' && (t.folder || 'Personal') !== selectedFolder) {
          return false;
        }
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          t.issuer.toLowerCase().includes(q) ||
          t.account.toLowerCase().includes(q) ||
          (t.folder && t.folder.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return a.issuer.localeCompare(b.issuer);
      });
  }, [tokens, selectedFolder, searchQuery]);

  // Handlers
  const handleAddToken = async (
    tokenData: Omit<AuthenticatorToken, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newToken: AuthenticatorToken = {
      ...tokenData,
      id: `token-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.uid,
    };

    setTokens((prev) => [newToken, ...prev]);
    showToast(`Cuenta "${newToken.issuer}" añadida con éxito.`);

    // Save to Firestore if user is logged in
    if (user) {
      try {
        await saveAuthenticatorTokenToFirestore(user.uid, newToken);
      } catch (err) {
        console.error('Error saving token to Firestore:', err);
      }
    }
  };

  const handleUpdateToken = async (updatedToken: AuthenticatorToken) => {
    setTokens((prev) => prev.map((t) => (t.id === updatedToken.id ? updatedToken : t)));
    showToast(`Cuenta "${updatedToken.issuer}" actualizada.`);

    if (user) {
      try {
        await saveAuthenticatorTokenToFirestore(user.uid, updatedToken);
      } catch (err) {
        console.error('Error updating token in Firestore:', err);
      }
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    const target = tokens.find((t) => t.id === tokenId);
    setTokens((prev) => prev.filter((t) => t.id !== tokenId));
    showToast(`Cuenta "${target?.issuer || '2FA'}" eliminada.`);

    if (user) {
      try {
        await deleteAuthenticatorTokenFromFirestore(user.uid, tokenId);
      } catch (err) {
        console.error('Error deleting token from Firestore:', err);
      }
    }
  };

  const handleTogglePin = async (tokenId: string) => {
    const updated = tokens.map((t) => (t.id === tokenId ? { ...t, isPinned: !t.isPinned } : t));
    setTokens(updated);

    const changed = updated.find((t) => t.id === tokenId);
    if (changed && user) {
      try {
        await saveAuthenticatorTokenToFirestore(user.uid, changed);
      } catch {}
    }
  };

  const handleCopyCode = async (token: AuthenticatorToken, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedTokenId(token.id);
      showToast(`Código de ${token.issuer} copiado: ${code}`);
      setTimeout(() => setCopiedTokenId(null), 2500);
    } catch {
      showToast(`Código: ${code}`);
    }
  };

  const handleToggleRevealSecret = (tokenId: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [tokenId]: !prev[tokenId] }));
  };

  const handleToggleRevealNextCode = (tokenId: string) => {
    setRevealedNextCodes((prev) => ({ ...prev, [tokenId]: !prev[tokenId] }));
  };

  const handleImportBackupTokens = async (importedList: AuthenticatorToken[]) => {
    const existingIds = new Set(tokens.map((t) => t.secret));
    const toAdd = importedList.filter((item) => !existingIds.has(item.secret));

    const merged = [...toAdd, ...tokens];
    setTokens(merged);

    if (user && toAdd.length > 0) {
      try {
        await batchSaveAuthenticatorTokensToFirestore(user.uid, toAdd);
      } catch (err) {
        console.error('Error batch saving imported tokens:', err);
      }
    }
  };

  const handleCreateDemoTokens = async () => {
    const demoItems: Omit<AuthenticatorToken, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        issuer: 'Google',
        account: user?.email || 'usuario@gmail.com',
        secret: generateRandomSecret(),
        digits: 6,
        period: 30,
        folder: 'Personal',
        color: '#4285F4',
        icon: 'google',
        isPinned: true,
      },
      {
        issuer: 'GitHub',
        account: user?.email?.split('@')[0] || 'desarrollador',
        secret: generateRandomSecret(),
        digits: 6,
        period: 30,
        folder: 'Dev',
        color: '#24292F',
        icon: 'github',
        isPinned: false,
      },
      {
        issuer: 'Orion Workspace',
        account: user?.email || 'admin@orion.app',
        secret: generateRandomSecret(),
        digits: 6,
        period: 30,
        folder: 'Trabajo',
        color: '#7C3AED',
        icon: 'orion',
        isPinned: false,
      },
    ];

    const created: AuthenticatorToken[] = demoItems.map((item, idx) => ({
      ...item,
      id: `token-demo-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.uid,
    }));

    setTokens((prev) => [...created, ...prev]);
    showToast('3 cuentas de prueba añadidas con éxito.');

    if (user) {
      try {
        await batchSaveAuthenticatorTokensToFirestore(user.uid, created);
      } catch {}
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#fbfbfa] dark:bg-[#141414] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-violet-500/30">
      {/* Top Header */}
      <header className="h-16 border-b border-[#e9e9e7] dark:border-[#272727] bg-white/95 dark:bg-[#1c1c1c]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 select-none z-20">
        <div className="flex items-center gap-3">
          <OrionAppSwitcher currentAppName="authenticator" />
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Authenticator
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 font-bold">
              2FA Cloud
            </span>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Cloud Sync Status Indicator */}
          {user ? (
            <div
              title="Tus credenciales están respaldadas y sincronizadas en la nube con tu cuenta de Google"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Nube Sincronizada</span>
            </div>
          ) : (
            <button
              onClick={loginWithGoogle}
              disabled={isLoadingGoogle}
              title="Inicia sesión para sincronizar automáticamente tus credenciales en todos tus dispositivos"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/60 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:opacity-90 cursor-pointer"
            >
              <Cloud className="w-3 h-3" />
              <span>Guardar en la nube</span>
            </button>
          )}

          {/* Security Status / Settings Button */}
          <button
            onClick={() => setIsSecuritySettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#282828] border border-neutral-200/70 dark:border-neutral-800 transition-colors cursor-pointer"
            title="Configurar seguridad de la bóveda (PIN, Passkey, SMS, Correo)"
          >
            <Shield className="w-3.5 h-3.5 text-violet-500" />
            <span className="hidden sm:inline">Seguridad</span>
            {securityConfig.isConfigured ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Bóveda protegida" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" title="Configuración requerida" />
            )}
          </button>

          {/* Quick Lock Button */}
          {securityConfig.isConfigured && (
            <button
              onClick={() => {
                setIsVaultLocked(true);
                showToast('Bóveda bloqueada.');
              }}
              className="p-1.5 rounded-xl text-neutral-700 dark:text-neutral-400 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-[#282828] border border-neutral-200/70 dark:border-neutral-800 transition-colors cursor-pointer"
              title="Bloquear bóveda ahora"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Backup Button */}
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#282828] border border-neutral-200/70 dark:border-neutral-800 transition-colors cursor-pointer"
            title="Exportar o importar copias de seguridad"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copia de Seguridad</span>
          </button>

          {/* Add Account Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Cuenta</span>
          </button>

          {/* User Account / Auth Button */}
          <div className="pl-1">
            <GoogleAuthButton compact />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 pb-24 md:pb-8">
        {/* Unauthenticated Cloud Warning Banner */}
        <AnimatePresence>
          {!user && tokens.length > 0 && !isCloudWarningDismissed && (
            <motion.div
              key="auth-cloud-warning-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="group relative p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-700 dark:text-amber-300 text-xs transition-all overflow-hidden"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Cloud className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Tus claves están guardadas localmente en este navegador.</strong> Inicia sesión con Google para sincronizarlas automáticamente con todos tus otros dispositivos.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  disabled={isLoadingGoogle}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs shrink-0 cursor-pointer hover:opacity-90 shadow-2xs"
                >
                  Iniciar sesión ahora
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dismissBannerPermanently('auth_cloud_local_warning', 'local_device');
                    setIsCloudWarningDismissed(true);
                  }}
                  title="Cerrar permanentemente"
                  className="opacity-0 group-hover:opacity-100 p-1 text-amber-700 hover:text-amber-950 dark:text-amber-300 dark:hover:text-white hover:bg-amber-500/20 rounded-lg transition-opacity cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar & Folders Segmented Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicio, cuenta o código..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#1e1e1e] border border-neutral-200/80 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-2xs"
            />
          </div>

          {/* Folder Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedFolder('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedFolder === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white/70 dark:bg-[#1e1e1e]/70 border border-neutral-200/60 dark:border-neutral-800'
              }`}
            >
              Todas ({tokens.length})
            </button>
            {folders.map((folderName) => (
              <button
                key={folderName}
                onClick={() => setSelectedFolder(folderName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedFolder === folderName
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-white/70 dark:bg-[#1e1e1e]/70 border border-neutral-200/60 dark:border-neutral-800'
                }`}
              >
                {folderName}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {tokens.length === 0 ? (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center rounded-3xl bg-white dark:bg-[#1c1c1c] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shadow-inner">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Tu Orion Authenticator está listo
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Añade tus cuentas con verificación en dos pasos (Google, GitHub, Discord, AWS) mediante código QR o clave manual. Todas tus credenciales se guardan y sincronizan en la nube.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir primera cuenta</span>
              </button>
              <button
                onClick={handleCreateDemoTokens}
                className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-[#252525] hover:bg-neutral-200 dark:hover:bg-[#2e2e2e] text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span>Cargar cuentas de prueba</span>
              </button>
            </div>
          </div>
        ) : filteredTokens.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 space-y-2">
            <Search className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-xs font-medium">No se encontraron cuentas para tu búsqueda.</p>
          </div>
        ) : (
          /* Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTokens.map((token) => {
              const codeInfo = generatedCodes[token.id] || generateTotpCode(token);
              const isUrgent = codeInfo.secondsRemaining <= 5;
              const isWarning = codeInfo.secondsRemaining <= 10;
              const isRevealed = revealedSecrets[token.id];
              const isNextRevealed = revealedNextCodes[token.id];
              const isCopied = copiedTokenId === token.id;

              // Circumference math for timer ring (radius 14)
              const circumference = 2 * Math.PI * 14;
              const strokeDashoffset =
                circumference - (codeInfo.percentageRemaining / 100) * circumference;

              return (
                <motion.div
                  key={token.id}
                  layout
                  className={`group relative rounded-3xl p-5 bg-white dark:bg-[#1e1e1e] border transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between ${
                    token.isPinned
                      ? 'border-violet-500/50 dark:border-violet-500/40 ring-1 ring-violet-500/20'
                      : 'border-neutral-200/90 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700/80'
                  }`}
                >
                  {/* Top card info */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center p-2 text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: token.color || '#7C3AED' }}
                        >
                          <AuthenticatorIcon
                            issuer={token.issuer}
                            iconKey={token.icon}
                            color={token.color}
                            className="w-5 h-5"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {token.issuer}
                          </h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono">
                            {token.account}
                          </p>
                        </div>
                      </div>

                      {/* Pin button */}
                      <button
                        onClick={() => handleTogglePin(token.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          token.isPinned
                            ? 'text-amber-500'
                            : 'text-neutral-300 dark:text-neutral-600 hover:text-amber-500 opacity-0 group-hover:opacity-100'
                        }`}
                        title={token.isPinned ? 'Desanclar' : 'Fijar arriba'}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    {/* BIG TOTP CODE DISPLAY */}
                    <div className="my-4 flex items-center justify-between">
                      <button
                        onClick={() => handleCopyCode(token, codeInfo.code)}
                        className="group/code flex items-center gap-2 text-left cursor-pointer focus:outline-hidden"
                        title="Haz clic para copiar código"
                      >
                        <span className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-neutral-900 dark:text-white transition-transform group-hover/code:scale-[1.02]">
                          {codeInfo.formattedCode}
                        </span>
                        <div
                          className={`p-1.5 rounded-lg transition-all ${
                            isCopied
                              ? 'bg-emerald-500 text-white'
                              : 'bg-neutral-100 dark:bg-[#282828] text-neutral-500 group-hover/code:text-violet-600 dark:group-hover/code:text-violet-400'
                          }`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </div>
                      </button>

                      {/* Circular Countdown Timer */}
                      <div className="relative flex items-center justify-center shrink-0">
                        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            className="stroke-neutral-200 dark:stroke-neutral-800"
                            strokeWidth="3"
                            fill="transparent"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            className={`transition-all duration-1000 ease-linear ${
                              isUrgent
                                ? 'stroke-rose-500'
                                : isWarning
                                ? 'stroke-amber-500'
                                : 'stroke-violet-600 dark:stroke-violet-400'
                            }`}
                            strokeWidth="3"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <span
                          className={`absolute font-mono text-[10px] font-bold ${
                            isUrgent
                              ? 'text-rose-500'
                              : isWarning
                              ? 'text-amber-500'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {codeInfo.secondsRemaining}s
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom details & quick actions */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2">
                    {/* Next code reveal button */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                      <button
                        onClick={() => handleToggleRevealNextCode(token.id)}
                        className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>Próximo código</span>
                      </button>
                      {isNextRevealed ? (
                        <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                          {codeInfo.nextCode}
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-400 font-mono">··· ···</span>
                      )}
                    </div>

                    {/* Secret key reveal */}
                    {isRevealed && (
                      <div className="p-2 rounded-xl bg-neutral-50 dark:bg-[#252525] border border-neutral-200/60 dark:border-neutral-700/60 text-[10px] font-mono break-all text-neutral-600 dark:text-neutral-300">
                        <span className="text-neutral-400">Clave secreta: </span>
                        {token.secret}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#282828] text-neutral-500 dark:text-neutral-400 font-medium">
                        {token.folder || 'Personal'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleRevealSecret(token.id)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                          title={isRevealed ? 'Ocultar clave secreta' : 'Ver clave secreta'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => setEditingToken(token)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                          title="Editar cuenta"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteToken(token.id)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Eliminar cuenta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthenticatorAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddToken={handleAddToken}
      />

      <AuthenticatorEditModal
        isOpen={Boolean(editingToken)}
        token={editingToken}
        onClose={() => setEditingToken(null)}
        onSave={handleUpdateToken}
        onDelete={handleDeleteToken}
      />

      <AuthenticatorBackupModal
        isOpen={isBackupModalOpen}
        tokens={tokens}
        onClose={() => setIsBackupModalOpen(false)}
        onImportTokens={handleImportBackupTokens}
        onShowToast={showToast}
      />

      {/* 1. Mandatory First-Time Security Setup Wizard */}
      <AuthenticatorSetupWizard
        isOpen={isSetupWizardOpen && !securityConfig.isConfigured}
        userEmail={user?.email}
        onComplete={handleSetupComplete}
        onCancel={() => {
          setIsSetupWizardOpen(false);
          showToast('Configuración omitida temporalmente. Puedes configurarla desde Seguridad.');
        }}
      />

      {/* 2. Fullscreen Lock Gate Screen */}
      {securityConfig.isConfigured && isVaultLocked && (
        <AuthenticatorLockGate
          config={securityConfig}
          userEmail={user?.email}
          onUnlock={handleUnlockVault}
        />
      )}

      {/* 3. Security Settings Modal */}
      <AuthenticatorSecuritySettingsModal
        isOpen={isSecuritySettingsOpen}
        config={securityConfig}
        userEmail={user?.email}
        onClose={() => setIsSecuritySettingsOpen(false)}
        onSaveConfig={handleSaveSecurityConfig}
        onLockNow={() => {
          setIsVaultLocked(true);
          showToast('Bóveda bloqueada.');
        }}
      />

      {/* Micro-Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
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
