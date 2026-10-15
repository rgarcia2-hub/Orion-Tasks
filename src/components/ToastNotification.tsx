import React from 'react';
import { useCalendar } from '../context/CalendarContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, RotateCcw, X, ShieldCheck } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toast, dismissToast, undoLastCompletion } = useCalendar();

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none flex flex-col items-end">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="pointer-events-auto max-w-sm sm:max-w-md bg-neutral-900 dark:bg-[#1f1f1f] text-white border border-neutral-700/80 dark:border-neutral-700 shadow-2xl rounded-xl p-3.5 flex items-start gap-3 backdrop-blur-md"
          >
            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-neutral-100">
                  Evento Finalizado
                </span>
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  Duplicación eliminada
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 dark:text-neutral-400 mt-1 leading-snug line-clamp-2">
                {toast.message}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>El evento original se mantiene intacto en tu calendario</span>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-1 shrink-0">
              {toast.undoTask && (
                <button
                  onClick={undoLastCompletion}
                  className="px-2 py-1 text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-neutral-800 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  title="Restaurar duplicación"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Deshacer</span>
                </button>
              )}
              <button
                onClick={dismissToast}
                className="p-1 text-neutral-400 hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
