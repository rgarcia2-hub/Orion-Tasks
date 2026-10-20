import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { RefreshCw, LogOut, Loader2, CheckCircle2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  compact?: boolean;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ compact = false }) => {
  const {
    user,
    isGoogleConnected,
    isLoadingGoogle,
    loginWithGoogle,
    logoutGoogle,
    refreshGoogleData,
    setIsWorkspaceModalOpen,
  } = useCalendar();

  if (isGoogleConnected && user) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={refreshGoogleData}
          disabled={isLoadingGoogle}
          title="Sincronizar eventos de Google Calendar"
          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGoogle ? 'animate-spin' : ''}`} />
        </button>

        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#f4f4f2] dark:bg-[#252525] rounded-lg text-xs border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all">
          <button
            onClick={() => setIsWorkspaceModalOpen(true)}
            title="Ver cuenta y aplicaciones de Orion Workspace"
            className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity cursor-pointer"
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Google'}
                className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-indigo-500/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                {(user.displayName || user.email || 'G')[0].toUpperCase()}
              </div>
            )}
            {!compact && (
              <span className="truncate max-w-[120px] font-medium text-neutral-800 dark:text-neutral-200 text-[11px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            )}
          </button>
          <button
            onClick={logoutGoogle}
            title="Desconectar cuenta de Google"
            className="text-neutral-400 hover:text-rose-500 transition-colors ml-1 cursor-pointer p-0.5 rounded"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={loginWithGoogle}
      disabled={isLoadingGoogle}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#242424] hover:bg-neutral-50 dark:hover:bg-[#2c2c2c] border border-[#e0e0de] dark:border-[#333333] rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
    >
      {isLoadingGoogle ? (
        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      ) : (
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="w-4 h-4 shrink-0"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
      )}
      <span>{compact ? 'Conectar' : 'Conectar Google Calendar'}</span>
    </button>
  );
};
