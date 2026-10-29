import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { useCalendar } from '../context/CalendarContext';
import { AppTask, TaskStatus, TaskPriority } from '../types/calendar';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ChevronRight,
  ListTodo,
  Tag,
  Sparkles,
} from 'lucide-react';

interface TasksTimelineViewProps {
  tasks: AppTask[];
  onSelectTask: (task: AppTask) => void;
}

export const TasksTimelineView: React.FC<TasksTimelineViewProps> = ({
  tasks,
  onSelectTask,
}) => {
  const { updateTaskStatus } = useCalendar();

  const timelineGroups = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);

    const overdue: AppTask[] = [];
    const todayTasks: AppTask[] = [];
    const next7Days: AppTask[] = [];
    const later: AppTask[] = [];
    const noDate: AppTask[] = [];

    tasks.forEach((task) => {
      if (!task.startDateTime) {
        noDate.push(task);
        return;
      }

      const taskDate = new Date(task.startDateTime);
      taskDate.setHours(0, 0, 0, 0);

      if (task.status === 'completed') {
        // Keep completed in their respective time or later
        if (taskDate.getTime() === today.getTime()) {
          todayTasks.push(task);
        } else if (taskDate < today) {
          overdue.push(task);
        } else {
          next7Days.push(task);
        }
        return;
      }

      if (taskDate < today) {
        overdue.push(task);
      } else if (taskDate.getTime() === today.getTime()) {
        todayTasks.push(task);
      } else if (taskDate <= sevenDaysLater) {
        next7Days.push(task);
      } else {
        later.push(task);
      }
    });

    return [
      {
        id: 'overdue',
        title: 'Vencidas',
        subtitle: 'Requieren atención inmediata',
        color: 'rose',
        headerBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
        badgeColor: 'bg-rose-500 text-white',
        items: overdue,
      },
      {
        id: 'today',
        title: 'Para Hoy',
        subtitle: 'Foco del día',
        color: 'blue',
        headerBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        badgeColor: 'bg-blue-600 text-white',
        items: todayTasks,
      },
      {
        id: 'next7days',
        title: 'Próximos 7 Días',
        subtitle: 'Planificación de la semana',
        color: 'indigo',
        headerBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        badgeColor: 'bg-indigo-600 text-white',
        items: next7Days,
      },
      {
        id: 'later',
        title: 'Más Adelante',
        subtitle: 'Hitos a medio plazo',
        color: 'purple',
        headerBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
        badgeColor: 'bg-purple-600 text-white',
        items: later,
      },
      {
        id: 'nodate',
        title: 'Sin Fecha Programada',
        subtitle: 'Bandeja de entrada y backlog',
        color: 'neutral',
        headerBg: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/30',
        badgeColor: 'bg-neutral-500 text-white',
        items: noDate,
      },
    ];
  }, [tasks]);

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-4 min-w-[1100px] items-start">
        {timelineGroups.map((group) => (
          <div
            key={group.id}
            className="flex-1 min-w-[240px] max-w-[320px] bg-neutral-50/70 dark:bg-[#1a1a1e]/60 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-3.5 space-y-3 shrink-0"
          >
            {/* Group Header */}
            <div className={`p-3 rounded-2xl border ${group.headerBg} flex items-center justify-between`}>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  {group.title}
                </h3>
                <p className="text-[10px] opacity-80 mt-0.5">
                  {group.subtitle}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${group.badgeColor}`}>
                {group.items.length}
              </span>
            </div>

            {/* Task Cards in this bucket */}
            <div className="space-y-2.5">
              {group.items.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 dark:text-neutral-600 text-xs">
                  Sin tareas en este periodo
                </div>
              ) : (
                group.items.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const priorityColors = {
                    high: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200',
                    medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200',
                    low: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200',
                  };

                  return (
                    <motion.div
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      whileHover={{ scale: 1.015 }}
                      className={`p-3.5 rounded-2xl bg-white dark:bg-[#202025] border border-neutral-200/80 dark:border-neutral-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-2.5 ${
                        isCompleted ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskStatus(
                              task.id,
                              isCompleted ? 'pending' : 'completed'
                            );
                          }}
                          className="mt-0.5 text-neutral-400 hover:text-emerald-500 transition-colors shrink-0"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-bold text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 ${
                              isCompleted ? 'line-through text-neutral-400 dark:text-neutral-500' : ''
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.startDateTime && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                              <Calendar className="w-3 h-3 text-neutral-400" />
                              <span>
                                {new Date(task.startDateTime).toLocaleDateString('es-ES', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer: Priority & Subtask count */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-neutral-100 dark:border-neutral-800/60">
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold capitalize border ${
                            priorityColors[task.priority] || ''
                          }`}
                        >
                          {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                        </span>

                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500 font-mono">
                            <ListTodo className="w-3 h-3" />
                            <span>
                              {task.subtasks.filter((s) => s.completed).length}/
                              {task.subtasks.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
