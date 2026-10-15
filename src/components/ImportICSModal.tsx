import React, { useState } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { X, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface ImportICSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportICSModal: React.FC<ImportICSModalProps> = ({ isOpen, onClose }) => {
  const { importICS, setActiveTab } = useCalendar();
  const [calendarName, setCalendarName] = useState('Google Calendar Export');
  const [calendarColor, setCalendarColor] = useState('#06B6D4');
  const [icsText, setIcsText] = useState('');
  const [importedCount, setImportedCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!calendarName || calendarName === 'Google Calendar Export') {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setCalendarName(fileNameWithoutExt);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setIcsText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!icsText.trim()) return;
    const count = importICS(icsText, calendarName, calendarColor);
    setImportedCount(count);
    if (count > 0) {
      setTimeout(() => {
        onClose();
        setImportedCount(null);
        setIcsText('');
        setActiveTab('calendars');
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-2xl border border-[#e9e9e7] dark:border-[#333333] shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#f0f0ee] dark:border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
              Importar Calendario (.ics / iCalendar)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Puedes cargar tu archivo <code>.ics</code> exportado de Google Calendar (o pegar el contenido iCal) para explorar y duplicar tus eventos reales en la app.
          </p>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Nombre para este Calendario
            </label>
            <input
              type="text"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-hidden"
            />
          </div>

          {/* File input */}
          <div className="p-4 border-2 border-dashed border-[#e0e0de] dark:border-[#333333] rounded-xl text-center hover:border-neutral-400 transition-colors">
            <input
              type="file"
              accept=".ics,text/calendar"
              onChange={handleFileUpload}
              className="hidden"
              id="ics-file-input"
            />
            <label htmlFor="ics-file-input" className="cursor-pointer space-y-2 block">
              <UploadCloud className="w-8 h-8 text-neutral-400 mx-auto" />
              <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Haz clic para seleccionar tu archivo <code>.ics</code>
              </div>
              <div className="text-[11px] text-neutral-400">Exportado desde Google Calendar, Outlook o Apple Calendar</div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              O pega el texto iCal directamente
            </label>
            <textarea
              rows={4}
              placeholder="BEGIN:VCALENDAR&#10;BEGIN:VEVENT&#10;SUMMARY:Reunión de equipo&#10;..."
              value={icsText}
              onChange={(e) => setIcsText(e.target.value)}
              className="w-full p-2.5 font-mono text-[11px] bg-[#f4f4f2] dark:bg-[#2a2a2a] text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-hidden placeholder-neutral-400"
            />
          </div>

          {importedCount !== null && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {importedCount > 0
                  ? `¡Se importaron ${importedCount} eventos correctamente!`
                  : 'No se encontraron eventos válidos en el formato proporcionado.'}
              </span>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#f0f0ee] dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!icsText.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
            >
              Procesar e Importar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
