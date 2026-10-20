import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react';

export const GoogleTaskConfirmModal: React.FC = () => {
  const { pendingGoogleTaskConfirm, cancelGoogleTaskConfirm, executeGoogleTaskConfirm } = useCalendar();

  if (!pendingGoogleTaskConfirm) return null;

  const { type, task } = pendingGoogleTaskConfirm;
  const isDelete = type === 'delete';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#202020] rounded-xl border border-[#e5e5e5] dark:border-[#333333] shadow-xl overflow-hidden p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDelete
                ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            {isDelete ? <Trash2 className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {isDelete ? '¿Eliminar tarea de Google Tasks?' : '¿Marcar como completada en Google Tasks?'}
            </h3>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {isDelete
                ? `Esta acción eliminará de forma permanente la tarea "${task.title}" directamente de tu cuenta de Google Tasks y de tu tablero de Orion.`
                : `Se actualizará el estado de "${task.title}" a completada en tu cuenta de Google Tasks.`}
            </p>
          </div>
          <button
            onClick={cancelGoogleTaskConfirm}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#f0f0ee] dark:border-[#2e2e2e]">
          <button
            onClick={cancelGoogleTaskConfirm}
            className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#282828] rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={executeGoogleTaskConfirm}
            className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-all shadow-xs cursor-pointer ${
              isDelete
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            {isDelete ? 'Eliminar tarea' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
