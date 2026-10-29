import React, { useState, useEffect, useMemo } from 'react';
import { Target, Calendar, CheckSquare, Plus } from 'lucide-react';
import { Task, TaskStatus, TASK_STATUS_LABELS } from '../models/types';
import {
  TaskDateFilter,
  TASK_DATE_FILTER_LABELS,
  isDateInPeriod,
} from '../utils/treeUtils';
import { TaskItem } from '../components/TaskItem';
import { useGoals } from '../contexts/GoalContext';
import { useTasks } from '../contexts/TaskContext';

type TaskFilterMode = 'objetivo' | 'data';

interface TasksViewProps {
  onOpenNewTaskModal: (defaultGoalId?: string | null) => void;
  onEditTask: (task: Task) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  onOpenNewTaskModal,
  onEditTask,
}) => {
  const { goals } = useGoals();
  const { tasks } = useTasks();

  const [taskFilterMode, setTaskFilterMode] =
    useState<TaskFilterMode>('objetivo');
  const [selectedGoalForTasks, setSelectedGoalForTasks] = useState<string>(
    () => goals[0]?.id || ''
  );
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<TaskDateFilter>('essa_semana');
  const [taskStatusFilter, setTaskStatusFilter] = useState<
    TaskStatus | 'todos'
  >('todos');

  // Mantém um objetivo válido selecionado no filtro por objetivo quando a lista de objetivos muda
  useEffect(() => {
    if (goals.length === 0) {
      setSelectedGoalForTasks('');
    } else if (!goals.some((g) => g.id === selectedGoalForTasks)) {
      setSelectedGoalForTasks(goals[0].id);
    }
  }, [goals, selectedGoalForTasks]);

  // Tarefas filtradas conforme A (Exibição por objetivo) ou B (Exibição por data)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskStatusFilter !== 'todos' && t.status !== taskStatusFilter) {
        return false;
      }

      if (taskFilterMode === 'objetivo') {
        if (!selectedGoalForTasks) return false;
        return t.goalId === selectedGoalForTasks;
      } else {
        return isDateInPeriod(t.dueDate, selectedDateFilter);
      }
    });
  }, [
    tasks,
    taskFilterMode,
    selectedGoalForTasks,
    selectedDateFilter,
    taskStatusFilter,
  ]);

  return (
    <section
      id="tarefas"
      aria-labelledby="heading-tarefas"
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2
            id="heading-tarefas"
            className="text-xl sm:text-2xl font-bold text-stone-900"
          >
            Minhas Tarefas
          </h2>
          <p className="text-sm text-stone-600 mt-0.5">
            Visualize suas tarefas filtrando por objetivo específico ou pelo prazo de vencimento.
            Clique ou pressione Enter em uma tarefa para abrir seus controles.
          </p>
        </div>
      </div>

      {/* Painel de Exibição: A) Exibição por objetivo | B) Exibição por data */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Seletor entre A (Por objetivo) e B (Por data) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-stone-600">
              Modo de exibição:
            </span>
            <div
              role="group"
              aria-label="Escolher modo de exibição das tarefas"
              className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl"
            >
              <button
                type="button"
                aria-pressed={taskFilterMode === 'objetivo'}
                onClick={() => setTaskFilterMode('objetivo')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  taskFilterMode === 'objetivo'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Target className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Exibição por objetivo</span>
              </button>

              <button
                type="button"
                aria-pressed={taskFilterMode === 'data'}
                onClick={() => setTaskFilterMode('data')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  taskFilterMode === 'data'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Exibição por data</span>
              </button>
            </div>
          </div>

          {/* Filtro de Status complementar */}
          <div
            role="group"
            aria-label="Filtrar tarefas por status"
            className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl self-start lg:self-auto"
          >
            {(
              [
                'todos',
                'nao_iniciada',
                'em_andamento',
                'concluida',
              ] as const
            ).map((st) => (
              <button
                key={st}
                type="button"
                aria-pressed={taskStatusFilter === st}
                onClick={() => setTaskStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  taskStatusFilter === st
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {st === 'todos' ? 'Todos os status' : TASK_STATUS_LABELS[st]}
              </button>
            ))}
          </div>
        </div>

        {/* Controle específico do modo selecionado (A ou B) */}
        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-3">
          {taskFilterMode === 'objetivo' ? (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <label
                htmlFor="select-goal-for-tasks"
                className="text-xs font-medium text-stone-700"
              >
                Selecionar objetivo:
              </label>
              {goals.length > 0 ? (
                <select
                  id="select-goal-for-tasks"
                  value={selectedGoalForTasks}
                  onChange={(e) => setSelectedGoalForTasks(e.target.value)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs sm:text-sm font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-stone-500">
                  Nenhum objetivo cadastrado.
                </span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <label
                htmlFor="select-date-for-tasks"
                className="text-xs font-medium text-stone-700"
              >
                Período de vencimento:
              </label>
              <select
                id="select-date-for-tasks"
                value={selectedDateFilter}
                onChange={(e) =>
                  setSelectedDateFilter(e.target.value as TaskDateFilter)
                }
                className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {(
                  [
                    'hoje',
                    'essa_semana',
                    'proximas_2_semanas',
                  ] as TaskDateFilter[]
                ).map((period) => (
                  <option key={period} value={period}>
                    {TASK_DATE_FILTER_LABELS[period]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Tarefas Enxutas */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto">
            <CheckSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-stone-800">
            Nenhuma tarefa encontrada para este filtro.
          </p>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {taskFilterMode === 'objetivo'
              ? 'Adicione uma nova tarefa para este objetivo ou selecione outro objetivo acima.'
              : `Não há tarefas com vencimento para ${TASK_DATE_FILTER_LABELS[selectedDateFilter]}.`}
          </p>
          <button
            type="button"
            onClick={() => {
              onOpenNewTaskModal(
                taskFilterMode === 'objetivo' && selectedGoalForTasks
                  ? selectedGoalForTasks
                  : null
              );
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Criar Nova Tarefa</span>
          </button>
        </div>
      ) : (
        <ul
          role="list"
          aria-label="Lista de tarefas"
          className="space-y-2.5"
        >
          {filteredTasks.map((task) => {
            const linkedGoal = goals.find((g) => g.id === task.goalId) || null;
            return (
              <li key={task.id}>
                <TaskItem
                  task={task}
                  linkedGoal={linkedGoal}
                  hideGoalName={taskFilterMode === 'objetivo'}
                  onEditTask={onEditTask}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

