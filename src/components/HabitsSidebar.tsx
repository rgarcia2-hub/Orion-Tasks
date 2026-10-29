import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCalendar } from '../context/CalendarContext';
import { HabitItem } from '../types/calendar';
import {
  Flame,
  Plus,
  Trash2,
  Check,
  Circle,
  X,
  Target,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface HabitsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HabitsSidebar: React.FC<HabitsSidebarProps> = ({ isOpen, onClose }) => {
  const { habits, addHabit, toggleHabitDate, deleteHabit } = useCalendar();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Productividad');
  const [newColor, setNewColor] = useState('#3B82F6');

  // Generate the last 7 days (including today)
  const last7Days = useMemo(() => {
    const days: { dateStr: string; label: string; isToday: boolean }[] = [];
    const dayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        label: dayLabels[d.getDay()],
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's completion stats
  const todayStats = useMemo(() => {
    const total = habits.length;
    if (total === 0) return { completed: 0, total: 0, percent: 0 };
    const completed = habits.filter((h) => h.completedDates.includes(todayStr)).length;
    return {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
    };
  }, [habits, todayStr]);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addHabit(newTitle, newCategory, newColor);
    setNewTitle('');
    setIsCreating(false);
  };

  const categories = ['Productividad', 'Foco', 'Salud', 'Lectura', 'Bienestar'];
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, width: 0, x: 20 }}
          animate={{ opacity: 1, width: 340, x: 0 }}
          exit={{ opacity: 0, width: 0, x: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="shrink-0 h-full border-l border-neutral-200/80 dark:border-neutral-800 bg-[#fbfbfa] dark:bg-[#18181a] flex flex-col overflow-hidden shadow-lg select-none"
        >
          {/* Top Header strictly named 'Hábitos' */}
          <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Hábitos
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Seguimiento de rachas diarias
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCreating(true)}
                title="Nuevo Hábito"
                className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Cerrar panel de hábitos"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Today's Progress Card */}
          <div className="p-4 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-white dark:bg-[#1c1c20] shrink-0">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <span>Progreso de hoy</span>
              </span>
              <span className="font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
                {todayStats.completed} / {todayStats.total} ({todayStats.percent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${todayStats.percent}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* New Habit Inline Form */}
          <AnimatePresence>
            {isCreating && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateHabit}
                className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-amber-50/40 dark:bg-amber-950/20 shrink-0 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    Nuevo Hábito
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Ej. Meditar 10 minutos..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#141416] text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />

                <div className="flex flex-wrap gap-1">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setNewCategory(cat)}
                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer ${
                        newCategory === cat
                          ? 'bg-amber-500 text-white font-semibold'
                          : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {colors.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewColor(c)}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          newColor === c ? 'scale-125 ring-2 ring-neutral-400 ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                  >
                    Guardar
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Habits List with 7-Day Dots */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {habits.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 dark:text-neutral-500">
                <Flame className="w-8 h-8 stroke-[1.2] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No tienes hábitos registrados</p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  + Crear primer hábito
                </button>
              </div>
            ) : (
              habits.map((habit) => {
                const isCompletedToday = habit.completedDates.includes(todayStr);

                return (
                  <div
                    key={habit.id}
                    className="p-3 rounded-2xl bg-white dark:bg-[#1f1f23] border border-neutral-200/70 dark:border-neutral-800/80 shadow-2xs space-y-2.5 group transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                  >
                    {/* Habit Title + Streak Badge + Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: habit.color || '#3B82F6' }}
                          />
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                            {habit.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium ml-4">
                          {habit.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          title={`Racha actual: ${habit.streak} días consecutivos`}
                          className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300/40 dark:border-amber-800/40 flex items-center gap-1"
                        >
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{habit.streak}d</span>
                        </span>

                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 transition-opacity"
                          title="Eliminar hábito"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 7-Day Completion Dots Row */}
                    <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between px-1">
                      {last7Days.map((day) => {
                        const isDone = habit.completedDates.includes(day.dateStr);

                        return (
                          <div key={day.dateStr} className="flex flex-col items-center gap-1">
                            <span
                              className={`text-[9.5px] font-semibold ${
                                day.isToday
                                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                                  : 'text-neutral-400 dark:text-neutral-500'
                              }`}
                            >
                              {day.label}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleHabitDate(habit.id, day.dateStr)}
                              title={`${day.isToday ? 'Hoy' : day.dateStr}: ${isDone ? 'Completado' : 'Pendiente'}`}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-500 text-white shadow-2xs'
                                  : day.isToday
                                  ? 'bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-blue-400 hover:border-emerald-500'
                                  : 'bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                              }`}
                            >
                              {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
