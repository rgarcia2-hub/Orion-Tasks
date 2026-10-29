import React, { useState, useMemo } from 'react';
import { useCalendar } from '../context/CalendarContext';
import { AppNote } from '../types/calendar';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Tag,
  Link2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  CheckSquare,
  Copy,
  Check,
  ListTodo,
  Bold,
  Italic,
  List,
  Heading,
  Code,
  Zap,
  Download,
  Printer,
  X,
} from 'lucide-react';

const NOTE_COLORS = [
  { name: 'Predeterminado', hex: '#6B7280' },
  { name: 'Azul', hex: '#3B82F6' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Púrpura', hex: '#8B5CF6' },
  { name: 'Ámbar', hex: '#F59E0B' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Rojo', hex: '#EF4444' },
];

export const NotesView: React.FC = () => {
  const {
    notes,
    selectedNoteId,
    setSelectedNoteId,
    addNote,
    updateNote,
    deleteNote,
    linkNoteToTask,
    linkNoteToEvent,
    tasks,
    events,
    setActiveTab,
    setSelectedTaskForDetail,
    setSelectedEventForDetail,
    isCloudSynced,
    createTaskDirectly,
  } = useCalendar();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [isLinkDropdownOpen, setIsLinkDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inNoteSearch, setInNoteSearch] = useState('');
  const [showInNoteSearch, setShowInNoteSearch] = useState(false);

  // All unique tags across all notes (excluding any legacy PRO tags)
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) =>
      n.tags?.forEach((t) => {
        if (t.toUpperCase() !== 'PRO') set.add(t);
      })
    );
    return Array.from(set);
  }, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesTag = n.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesTag) return false;
      }

      if (selectedTagFilter === 'pinned') return n.isPinned;
      if (selectedTagFilter === 'linked') return Boolean(n.linkedTaskId || n.linkedEventId);
      if (selectedTagFilter !== 'all') {
        return n.tags?.includes(selectedTagFilter);
      }
      return true;
    }).sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, searchQuery, selectedTagFilter]);

  const activeNote = notes.find((n) => n.id === selectedNoteId) || filteredNotes[0] || null;

  // Linked task or event objects
  const linkedTask = activeNote?.linkedTaskId ? tasks.find((t) => t.id === activeNote.linkedTaskId) : null;
  const linkedEvent = activeNote?.linkedEventId ? events.find((e) => e.id === activeNote.linkedEventId) : null;

  const handleCreateNewNote = () => {
    const created = addNote({
      title: 'Nota sin título',
      content: '',
      tags: ['Ideas'],
      color: '#3B82F6',
      isPinned: false,
    });
    setSelectedNoteId(created.id);
  };

  const handleTogglePin = (note: AppNote) => {
    updateNote(note.id, { isPinned: !note.isPinned });
  };

  const handleInsertSnippet = (snippet: string) => {
    if (!activeNote) return;
    const current = activeNote.content || '';
    updateNote(activeNote.id, { content: current ? `${current}\n${snippet}` : snippet });
  };

  const handleCopyNote = () => {
    if (!activeNote) return;
    navigator.clipboard.writeText(`${activeNote.title}\n\n${activeNote.content}`);
    setCopiedId(activeNote.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Checklists in active note
  const checklistData = useMemo(() => {
    if (!activeNote || !activeNote.content) return { items: [], completedCount: 0, totalCount: 0, percent: 0 };
    const lines = activeNote.content.split('\n');
    const items: { lineIndex: number; text: string; completed: boolean }[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
      if (match) {
        items.push({
          lineIndex: idx,
          completed: match[1].toLowerCase() === 'x',
          text: match[2].trim(),
        });
      }
    });

    const totalCount = items.length;
    const completedCount = items.filter((i) => i.completed).length;
    const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { items, completedCount, totalCount, percent };
  }, [activeNote]);

  const toggleChecklistItem = (lineIndex: number, currentCompleted: boolean) => {
    if (!activeNote) return;
    const lines = activeNote.content.split('\n');
    if (lines[lineIndex] !== undefined) {
      const nextMark = currentCompleted ? ' ' : 'x';
      lines[lineIndex] = lines[lineIndex].replace(/^-\s*\[([ xX])\]/, `- [${nextMark}]`);
      updateNote(activeNote.id, { content: lines.join('\n') });
    }
  };

  const handleExportMarkdown = () => {
    if (!activeNote) return;
    const blob = new Blob([`# ${activeNote.title}\n\n${activeNote.content}`], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(activeNote.title || 'nota').replace(/[^a-z0-9áéíóúñ]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Convert note to Task in Kanban
  const handleCreateTaskFromNote = () => {
    if (!activeNote) return;
    const createdTask = createTaskDirectly({
      title: activeNote.title,
      description: activeNote.content,
      calendarId: 'default',
      calendarName: 'Notas',
      calendarColor: activeNote.color || '#3B82F6',
      startDateTime: new Date().toISOString(),
      endDateTime: new Date(Date.now() + 3600000).toISOString(),
      isAllDay: false,
      status: 'pending',
      priority: 'medium',
      notes: `Generado desde nota: "${activeNote.title}"`,
      tags: activeNote.tags || ['Notas'],
      subtasks: [
        { id: `sub-${Date.now()}-1`, text: 'Revisar detalles de la nota', completed: false },
      ],
    });
    // Update link to the created task
    linkNoteToTask(activeNote.id, createdTask.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-4 animate-in fade-in duration-300">
      {/* Main Workspace: 2 Columns (List on Left, Editor on Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[620px] items-stretch">
        {/* Left Column: Notes List & Filters (4 cols) */}
        <div className="md:col-span-4 bg-[#fbfbfa] dark:bg-[#1f1f1f] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] p-3 flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            {/* Search Bar & New Note Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Buscar notas o etiquetas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#282828] border border-[#e9e9e7] dark:border-[#383838] rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-neutral-400"
                />
              </div>
              <button
                onClick={handleCreateNewNote}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-white shrink-0 shadow-xs transition-colors cursor-pointer"
                title="Crear nueva nota"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva</span>
              </button>
            </div>

            {/* Tag Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <button
                onClick={() => setSelectedTagFilter('all')}
                className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer ${
                  selectedTagFilter === 'all'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                    : 'bg-white dark:bg-[#282828] text-neutral-600 dark:text-neutral-300 border border-[#e9e9e7] dark:border-[#383838]'
                }`}
              >
                Todas ({notes.length})
              </button>
              <button
                onClick={() => setSelectedTagFilter('pinned')}
                className={`px-2 py-0.5 rounded-md font-medium shrink-0 flex items-center gap-1 transition-colors cursor-pointer ${
                  selectedTagFilter === 'pinned'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-[#282828] text-neutral-600 dark:text-neutral-300 border border-[#e9e9e7] dark:border-[#383838]'
                }`}
              >
                <Pin className="w-2.5 h-2.5" />
                <span>Fijadas</span>
              </button>
              <button
                onClick={() => setSelectedTagFilter('linked')}
                className={`px-2 py-0.5 rounded-md font-medium shrink-0 flex items-center gap-1 transition-colors cursor-pointer ${
                  selectedTagFilter === 'linked'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-[#282828] text-neutral-600 dark:text-neutral-300 border border-[#e9e9e7] dark:border-[#383838]'
                }`}
              >
                <Link2 className="w-2.5 h-2.5" />
                <span>Vinculadas</span>
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(tag)}
                  className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors cursor-pointer ${
                    selectedTagFilter === tag
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-[#282828] text-neutral-600 dark:text-neutral-300 border border-[#e9e9e7] dark:border-[#383838]'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Notes List */}
            <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-1">
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => {
                  const isSelected = activeNote?.id === note.id;

                  return (
                    <div
                      key={note.id}
                      onClick={() => setSelectedNoteId(note.id)}
                      className={`group p-3 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-white dark:bg-[#282828] border-neutral-400 dark:border-neutral-500 shadow-xs'
                          : 'bg-white/60 dark:bg-[#242424]/60 border-[#e9e9e7] dark:border-[#2f2f2f] hover:bg-white dark:hover:bg-[#282828] hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {note.color && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: note.color }}
                            />
                          )}
                          <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {note.title || 'Sin título'}
                          </h3>
                        </div>

                        {note.isPinned && (
                          <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                        {note.content || 'Nota vacía...'}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px]">
                        {/* Link Chip */}
                        {note.linkedTaskId && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-medium">
                            <CheckSquare className="w-2.5 h-2.5" />
                            <span>Tarea vinculada</span>
                          </span>
                        )}
                        {note.linkedEventId && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium">
                            <CalendarIcon className="w-2.5 h-2.5" />
                            <span>Evento vinculado</span>
                          </span>
                        )}

                        {note.tags?.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          >
                            #{t}
                          </span>
                        ))}

                        <span className="ml-auto font-mono text-[10px] tabular-nums text-neutral-400">
                          {new Date(note.updatedAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
                  <FileText className="w-6 h-6 mx-auto text-neutral-300 dark:text-neutral-600" />
                  <p>No se encontraron notas con este filtro.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-[#e9e9e7] dark:border-[#2e2e2e] text-[11px] font-mono tabular-nums text-neutral-400 flex items-center justify-between">
            <span>{notes.length} notas en tu cuenta</span>
            {isCloudSynced && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Sincronizado
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Note Editor & Vincular Tareas (8 cols) */}
        <div className="md:col-span-8 bg-white dark:bg-[#202020] rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] p-5 flex flex-col justify-between shadow-xs">
          {activeNote ? (
            <div className="space-y-4">
              {/* Top Toolbar: Pin, Color, Link to Task/Event, Delete */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#f0f0ee] dark:border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  {/* Pin Toggle */}
                  <button
                    onClick={() => handleTogglePin(activeNote)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      activeNote.isPinned
                        ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800'
                        : 'border-[#e9e9e7] dark:border-[#333] text-neutral-400 hover:text-neutral-700'
                    }`}
                    title={activeNote.isPinned ? 'Desfijar nota' : 'Fijar nota arriba'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${activeNote.isPinned ? 'fill-amber-500' : ''}`} />
                  </button>

                  {/* Color Selector */}
                  <div className="flex items-center gap-1 pl-1">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => updateNote(activeNote.id, { color: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                          activeNote.color === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-neutral-400' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Right Controls: Link Dropdown, Copy, Delete */}
                <div className="flex items-center gap-2 relative">
                  {/* Link Button / Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsLinkDropdownOpen(!isLinkDropdownOpen)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        activeNote.linkedTaskId || activeNote.linkedEventId
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>
                        {activeNote.linkedTaskId
                          ? 'Vinculada a Tarea'
                          : activeNote.linkedEventId
                          ? 'Vinculada a Evento'
                          : 'Vincular a Tarea / Evento'}
                      </span>
                    </button>

                    {/* Link Dropdown Modal/Menu */}
                    {isLinkDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-[#252525] border border-[#e5e5e3] dark:border-[#383838] rounded-xl shadow-lg z-30 p-2 text-xs space-y-2 animate-in fade-in">
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200 px-2 py-1 border-b border-[#f0f0ee] dark:border-[#303030]">
                          Vincular esta nota a:
                        </div>

                        {/* Link to Tasks */}
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase font-bold text-neutral-400 px-2">
                            Tareas del Kanban
                          </div>
                          <div className="max-h-36 overflow-y-auto space-y-0.5">
                            {tasks.length > 0 ? (
                              tasks.map((task) => (
                                <button
                                  key={task.id}
                                  onClick={() => {
                                    linkNoteToTask(activeNote.id, task.id);
                                    setIsLinkDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-2 py-1.5 rounded-md truncate transition-colors cursor-pointer flex items-center justify-between ${
                                    activeNote.linkedTaskId === task.id
                                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 font-semibold'
                                      : 'hover:bg-neutral-100 dark:hover:bg-[#303030] text-neutral-700 dark:text-neutral-300'
                                  }`}
                                >
                                  <span className="truncate">{task.title}</span>
                                  {activeNote.linkedTaskId === task.id && (
                                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="px-2 py-1 text-neutral-400 text-[11px]">
                                No hay tareas activas en el tablero.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Link to Events */}
                        <div className="space-y-1 pt-1 border-t border-[#f0f0ee] dark:border-[#303030]">
                          <div className="text-[10px] uppercase font-bold text-neutral-400 px-2">
                            Eventos de Calendario
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-0.5">
                            {events.slice(0, 8).map((evt) => (
                              <button
                                key={evt.id}
                                onClick={() => {
                                  linkNoteToEvent(activeNote.id, evt.id);
                                  setIsLinkDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2 py-1.5 rounded-md truncate transition-colors cursor-pointer flex items-center justify-between ${
                                  activeNote.linkedEventId === evt.id
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 font-semibold'
                                    : 'hover:bg-neutral-100 dark:hover:bg-[#303030] text-neutral-700 dark:text-neutral-300'
                                }`}
                              >
                                <span className="truncate">{evt.title}</span>
                                {activeNote.linkedEventId === evt.id && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Remove Link Option */}
                        {(activeNote.linkedTaskId || activeNote.linkedEventId) && (
                          <div className="pt-1 border-t border-[#f0f0ee] dark:border-[#303030]">
                            <button
                              onClick={() => {
                                updateNote(activeNote.id, { linkedTaskId: undefined, linkedEventId: undefined });
                                setIsLinkDropdownOpen(false);
                              }}
                              className="w-full text-left px-2 py-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                            >
                              Desvincular nota
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* In-Editor Search Toggle */}
                  <button
                    onClick={() => setShowInNoteSearch((prev) => !prev)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      showInNoteSearch
                        ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800'
                        : 'border-[#e9e9e7] dark:border-[#333] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                    title="Buscar dentro de la nota"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>

                  {/* Export Markdown */}
                  <button
                    onClick={handleExportMarkdown}
                    className="p-1.5 rounded-lg border border-[#e9e9e7] dark:border-[#333] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                    title="Exportar como archivo Markdown (.md)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Export PDF / Print */}
                  <button
                    onClick={handleExportPDF}
                    className="p-1.5 rounded-lg border border-[#e9e9e7] dark:border-[#333] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                    title="Exportar a PDF / Imprimir"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleCopyNote}
                    className="p-1.5 rounded-lg border border-[#e9e9e7] dark:border-[#333] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                    title="Copiar contenido de la nota"
                  >
                    {copiedId === activeNote.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteNote(activeNote.id)}
                    className="p-1.5 rounded-lg border border-[#e9e9e7] dark:border-[#333] text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Eliminar esta nota"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Linked Item Banner (if linked to a task or event) */}
              {linkedTask && (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="font-semibold text-blue-900 dark:text-blue-200 truncate">
                      Tarea vinculada: {linkedTask.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 font-mono shrink-0">
                      {linkedTask.status === 'in_progress' ? 'En curso' : linkedTask.status === 'completed' ? 'Hecho' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedTaskForDetail(linkedTask);
                        setActiveTab('tasks');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Abrir en Kanban</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {linkedEvent && (
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 truncate">
                      Evento vinculado: {linkedEvent.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-mono shrink-0">
                      {linkedEvent.calendarName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedEventForDetail(linkedEvent)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <span>Ver evento</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => updateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Título de la nota..."
                  className="w-full text-xl sm:text-2xl font-bold bg-transparent text-neutral-900 dark:text-neutral-100 placeholder-neutral-300 dark:placeholder-neutral-600 focus:outline-hidden"
                />
              </div>

              {/* Tags Editor */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                {activeNote.tags
                  ?.filter((t) => t.toUpperCase() !== 'PRO')
                  .map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-medium"
                    >
                      <span>#{tag}</span>
                      <button
                        onClick={() =>
                          updateNote(activeNote.id, {
                            tags: activeNote.tags.filter((t) => t !== tag),
                          })
                        }
                        className="hover:text-rose-500 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                <input
                  type="text"
                  placeholder="+ Añadir etiqueta (Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim().replace(/^#/, '');
                      if (!activeNote.tags?.includes(newTag)) {
                        updateNote(activeNote.id, { tags: [...(activeNote.tags || []), newTag] });
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  className="px-2 py-0.5 text-xs bg-transparent border border-dashed border-neutral-300 dark:border-neutral-700 rounded-md placeholder-neutral-400 focus:outline-hidden"
                />
              </div>

              {/* Formatting Quick Bar */}
              <div className="flex items-center gap-1 p-1 bg-[#fafaf8] dark:bg-[#1a1a1a] rounded-lg border border-[#f0f0ee] dark:border-[#2a2a2a] text-xs">
                <button
                  onClick={() => handleInsertSnippet('### Nuevo Encabezado\n')}
                  className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-[#282828] text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  title="Encabezado"
                >
                  <Heading className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertSnippet('- Elemento de lista\n- Segundo punto\n')}
                  className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-[#282828] text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  title="Lista con viñetas"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertSnippet('- [ ] Tarea pendiente\n- [x] Tarea completada\n')}
                  className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-[#282828] text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  title="Casilla de verificación"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleInsertSnippet('```ts\n// Código o apunte técnico\n```\n')}
                  className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-[#282828] text-neutral-600 dark:text-neutral-300 cursor-pointer"
                  title="Bloque de código"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

                <button
                  onClick={handleCreateTaskFromNote}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 rounded hover:bg-purple-100 transition-colors ml-auto cursor-pointer"
                  title="Crear una tarea en Kanban a partir de esta nota"
                >
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>Convertir en Tarea Kanban</span>
                </button>
              </div>

              {/* In-Editor Search Bar */}
              {showInNoteSearch && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs">
                  <Search className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar texto en esta nota..."
                    value={inNoteSearch}
                    onChange={(e) => setInNoteSearch(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none"
                  />
                  {inNoteSearch && (
                    <span className="text-[10.5px] font-mono text-blue-600 dark:text-blue-400">
                      {(() => {
                        try {
                          const count = (activeNote.content.match(new RegExp(inNoteSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
                          return `${count} ${count === 1 ? 'coincidencia' : 'coincidencias'}`;
                        } catch {
                          return '';
                        }
                      })()}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setInNoteSearch('');
                      setShowInNoteSearch(false);
                    }}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Interactive Checklists Progress Widget */}
              {checklistData.totalCount > 0 && (
                <div className="p-3 rounded-xl bg-[#f8f8f7] dark:bg-[#1a1a1d] border border-neutral-200 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Lista de verificación interactiva</span>
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      {checklistData.completedCount} de {checklistData.totalCount} ({checklistData.percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${checklistData.percent}%` }}
                    />
                  </div>
                  <div className="space-y-1 pt-1 max-h-36 overflow-y-auto">
                    {checklistData.items.map((item) => (
                      <div
                        key={item.lineIndex}
                        onClick={() => toggleChecklistItem(item.lineIndex, item.completed)}
                        className="flex items-center gap-2 p-1 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 cursor-pointer text-xs select-none"
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                            item.completed
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : 'border-neutral-400 dark:border-neutral-600'
                          }`}
                        >
                          {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span
                          className={`flex-1 truncate ${
                            item.completed
                              ? 'line-through text-neutral-400 dark:text-neutral-500'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {item.text || '(Elemento sin descripción)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note Content Textarea */}
              <div className="relative">
                <textarea
                  value={activeNote.content}
                  onChange={(e) => updateNote(activeNote.id, { content: e.target.value })}
                  placeholder="Escribe tus apuntes, notas de reunión, objetivos o listas aquí..."
                  rows={16}
                  className="w-full bg-transparent text-sm text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 focus:outline-hidden font-mono leading-relaxed resize-none p-1"
                />
              </div>
            </div>
          ) : (
            <div className="py-24 text-center space-y-3">
              <FileText className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Selecciona una nota para verla o crea una nueva
              </p>
              <button
                onClick={handleCreateNewNote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Nota</span>
              </button>
            </div>
          )}

          {/* Footer Stats */}
          {activeNote && (
            <div className="pt-3 mt-4 border-t border-[#f0f0ee] dark:border-[#2a2a2a] flex flex-wrap items-center justify-between text-[11px] text-neutral-400 font-mono tabular-nums">
              <div className="flex items-center gap-3">
                <span>
                  {activeNote.content ? activeNote.content.trim().split(/\s+/).length : 0} palabras
                </span>
                <span>·</span>
                <span>{activeNote.content?.length || 0} caracteres</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>
                  Actualizada{' '}
                  {new Date(activeNote.updatedAt).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
