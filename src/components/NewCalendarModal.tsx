import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';

interface NewCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export const NewCalendarModal: React.FC<NewCalendarModalProps> = ({ isOpen, onClose }) => {
  const { addCalendar } = useCalendar();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCalendar(name.trim(), color, description.trim() || undefined);
    onClose();
    setName('');
    setDescription('');
    setColor(COLOR_PRESETS[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-[#e9e9e7] dark:border-[#333333] shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0f0ee] dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Nuevo Calendario
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Nombre del Calendario *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Clientes VIP, Tesis, Entrenamiento..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Descripción (Opcional)
            </label>
            <input
              type="text"
              placeholder="Objetivo o alcance de este calendario"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg placeholder-neutral-400 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
              Color Distintivo
            </label>
            <div className="flex items-center gap-3">
              {COLOR_PRESETS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#f0f0ee] dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
            >
              Crear Calendario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
