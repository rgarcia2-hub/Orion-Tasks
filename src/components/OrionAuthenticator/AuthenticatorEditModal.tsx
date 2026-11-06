import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Pencil, Check, Trash2 } from 'lucide-react';
import { AuthenticatorToken } from '../../types/authenticator';

interface AuthenticatorEditModalProps {
  isOpen: boolean;
  token: AuthenticatorToken | null;
  onClose: () => void;
  onSave: (updatedToken: AuthenticatorToken) => void;
  onDelete: (tokenId: string) => void;
}

export const AuthenticatorEditModal: React.FC<AuthenticatorEditModalProps> = ({
  isOpen,
  token,
  onClose,
  onSave,
  onDelete,
}) => {
  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [folder, setFolder] = useState('Personal');
  const [color, setColor] = useState('#7C3AED');

  useEffect(() => {
    if (token && isOpen) {
      setIssuer(token.issuer);
      setAccount(token.account);
      setFolder(token.folder || 'Personal');
      setColor(token.color || '#7C3AED');
    }
  }, [token, isOpen]);

  if (!isOpen || !token) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...token,
      issuer: issuer.trim() || token.issuer,
      account: account.trim() || token.account,
      folder: folder.trim() || 'General',
      color,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const colors = ['#4285F4', '#24292F', '#00A4EF', '#5865F2', '#FF9900', '#10B981', '#EC4899', '#7C3AED'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white dark:bg-[#1e1e1e] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 z-10 space-y-5"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                style={{ backgroundColor: color }}
              >
                <Pencil className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Editar Cuenta 2FA
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Servicio / Emisor
              </label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Usuario / Correo
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Carpeta / Categoría
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-[#262626] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="Personal">Personal</option>
                <option value="Trabajo">Trabajo</option>
                <option value="Finanzas">Finanzas</option>
                <option value="Dev">Dev / Código</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Color Distintivo
              </label>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                      color === c ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-[#1e1e1e]' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800/80">
              <button
                type="button"
                onClick={() => {
                  onDelete(token.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
