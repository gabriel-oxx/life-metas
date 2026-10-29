import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
  PauseCircle,
  Archive,
  PlayCircle,
  CheckSquare,
} from 'lucide-react';
import {
  GoalWithProgress,
  GoalStatus,
  Task,
  TaskStatus,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from '../models/types';
import { formatDateBR, formatUnitValue } from '../utils/treeUtils';
import { TaskItem } from './TaskItem';
import { useGoals } from '../contexts/GoalContext';

interface GoalDetailPanelProps {
  goal: GoalWithProgress;
  linkedTasks: Task[];
  onBack: () => void;
  onEditGoal: (goal: GoalWithProgress) => void;
  onDeleteGoal: (goal: GoalWithProgress) => void;
  onChangeGoalStatus?: (goalId: string, newStatus: GoalStatus) => void;
  onOpenNewTaskForGoal: (goalId: string) => void;
  onUpdateTaskStatus?: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddSubtask?: (
    taskId: string,
    parentId: string,
    title: string,
    dueDate: string | null
  ) => void;
  onUpdateSubtaskStatus?: (
    taskId: string,
    subtaskId: string,
    newStatus: TaskStatus
  ) => void;
  onEditSubtask?: (
    taskId: string,
    subtaskId: string,
    updates: { title: string; dueDate: string | null; status: TaskStatus }
  ) => void;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => void;
}

export const GoalDetailPanel: React.FC<GoalDetailPanelProps> = ({
  goal,
  linkedTasks,
  onBack,
  onEditGoal,
  onDeleteGoal,
  onChangeGoalStatus: propOnChangeGoalStatus,
  onOpenNewTaskForGoal,
  onUpdateTaskStatus,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onEditSubtask,
  onDeleteSubtask,
}) => {
  const { changeGoalStatus } = useGoals();
  const handleChangeGoalStatus = propOnChangeGoalStatus || changeGoalStatus;
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | 'todos'>(
    'todos'
  );
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Move o foco para o título do painel ao abrir para anunciar o objetivo no leitor de tela
  useEffect(() => {
    headingRef.current?.focus();
  }, [goal.id]);

  const filteredTasks = linkedTasks.filter((t) =>
    taskStatusFilter === 'todos' ? true : t.status === taskStatusFilter
  );

  const getStatusTextColor = (status: GoalStatus) => {
    switch (status) {
      case 'ativo':
        return 'text-emerald-700 font-semibold';
      case 'concluido':
        return 'text-teal-700 font-semibold';
      case 'pausado':
        return 'text-amber-700 font-semibold';
      case 'arquivado':
        return 'text-stone-500 font-medium';
    }
  };

  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case 'ativo':
        return (
          <PlayCircle
            className="w-4 h-4 text-emerald-700 shrink-0"
            aria-hidden="true"
          />
        );
      case 'concluido':
        return (
          <CheckCircle2
            className="w-4 h-4 text-teal-700 shrink-0"
            aria-hidden="true"
          />
        );
      case 'pausado':
        return (
          <PauseCircle
            className="w-4 h-4 text-amber-700 shrink-0"
            aria-hidden="true"
          />
        );
      case 'arquivado':
        return (
          <Archive
            className="w-4 h-4 text-stone-500 shrink-0"
            aria-hidden="true"
          />
        );
    }
  };

  const progressText = `${goal.progressPercent}%, ${formatUnitValue(
    goal.currentValue,
    goal.unitType
  )} de ${formatUnitValue(goal.targetValue, goal.unitType)}`;

  return (
    <section
      aria-labelledby="goal-detail-heading"
      className="space-y-6 animate-in fade-in duration-150"
    >
      {/* Navegação de retorno */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-stone-700 hover:text-stone-950 bg-white border border-stone-200/90 hover:bg-stone-100 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Voltar para Meus Objetivos</span>
        </button>
      </div>

      {/* Cabeçalho e Controles Exclusivos do Objetivo Selecionado */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className="font-medium text-stone-700">
                {GOAL_CATEGORY_LABELS[goal.category]}
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={`inline-flex items-center gap-1 ${getStatusTextColor(
                  goal.status
                )}`}
              >
                {getStatusIcon(goal.status)}
                {GOAL_STATUS_LABELS[goal.status]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {goal.deadline
                  ? `Prazo: ${formatDateBR(goal.deadline)}`
                  : 'Sem prazo final'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                Criado em {formatDateBR(goal.createdAt)}
              </span>
            </div>

            <h2
              id="goal-detail-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug focus:outline-none"
            >
              {goal.title}
            </h2>
          </div>

          {/* Barra de ações do objetivo: só aparece aqui dentro do painel do objetivo */}
          <div
            role="group"
            aria-label={`Ações para o objetivo ${goal.title}`}
            className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 shrink-0"
          >
            <div className="flex items-center gap-2">
              <label
                htmlFor={`detail-status-select-${goal.id}`}
                className="text-xs font-medium text-stone-600"
              >
                Status:
              </label>
              <select
                id={`detail-status-select-${goal.id}`}
                value={goal.status}
                onChange={(e) =>
                  handleChangeGoalStatus(goal.id, e.target.value as GoalStatus)
                }
                className="text-xs font-medium bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {(Object.keys(GOAL_STATUS_LABELS) as GoalStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {GOAL_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => onEditGoal(goal)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Editar objetivo</span>
            </button>

            <button
              type="button"
              onClick={() => onDeleteGoal(goal)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100/80 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Excluir objetivo</span>
            </button>
          </div>
        </div>

        {/* Barra de Progresso Detalhada */}
        <div className="pt-5 border-t border-stone-100 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="text-xs text-stone-500 block">
                Progresso acumulado no objetivo
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono-tabular text-stone-900">
                {formatUnitValue(goal.currentValue, goal.unitType)}
              </span>{' '}
              <span className="text-xs sm:text-sm font-mono-tabular text-stone-500">
                de {formatUnitValue(goal.targetValue, goal.unitType)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-base sm:text-lg font-bold font-mono-tabular text-emerald-800">
                {goal.progressPercent}%
              </span>
              <span className="text-xs text-stone-500 block font-mono-tabular">
                {goal.completedTasksCount} de {goal.linkedTasksCount} tarefas concluídas
              </span>
            </div>
          </div>

          <div
            className="w-full h-3 bg-stone-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-label={`Progresso do objetivo ${goal.title}`}
            aria-valuenow={goal.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={progressText}
          >
            <div
              className={`h-full rounded-full transition-transform duration-200 origin-left ${
                goal.progressPercent >= 100 ? 'bg-teal-600' : 'bg-emerald-600'
              }`}
              style={{
                width: '100%',
                transform: `scaleX(${Math.min(1, goal.progressPercent / 100)})`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Tarefas e Subtarefas Vinculadas a este Objetivo */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-stone-900">
              Tarefas deste Objetivo ({linkedTasks.length})
            </h3>
            <p className="text-xs sm:text-sm text-stone-600">
              Conclua as tarefas e subtarefas abaixo para somar progresso diretamente a esta meta.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenNewTaskForGoal(goal.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Nova Tarefa neste Objetivo</span>
          </button>
        </div>

        {/* Filtro rápido por status das tarefas deste objetivo */}
        {linkedTasks.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200/90">
            <span className="text-xs font-medium text-stone-600 px-1">
              Filtrar etapas por status:
            </span>
            <div
              role="group"
              aria-label="Filtrar tarefas deste objetivo por status"
              className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl"
            >
              {(
                ['todos', 'nao_iniciada', 'em_andamento', 'concluida'] as const
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
        )}

        {/* Lista de Tarefas do Objetivo */}
        {linkedTasks.length === 0 ? (
          <div className="bg-white border border-stone-200/90 rounded-2xl p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckSquare className="w-5 h-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-stone-800">
              Nenhuma tarefa vinculada a este objetivo ainda.
            </p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Divida seu objetivo em tarefas menores e quantificáveis para avançar com consistência.
            </p>
            <button
              type="button"
              onClick={() => onOpenNewTaskForGoal(goal.id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Adicionar primeira tarefa</span>
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 text-center space-y-2">
            <p className="text-sm font-medium text-stone-800">
              Nenhuma tarefa encontrada neste status.
            </p>
            <button
              type="button"
              onClick={() => setTaskStatusFilter('todos')}
              className="text-xs font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-950"
            >
              Mostrar todas as tarefas do objetivo
            </button>
          </div>
        ) : (
          <ul
            role="list"
            aria-label={`Lista de tarefas do objetivo ${goal.title}`}
            className="space-y-3"
          >
            {filteredTasks.map((task) => (
              <li key={task.id}>
                <TaskItem
                  task={task}
                  linkedGoal={goal}
                  hideGoalName={true}
                  onEditTask={onEditTask}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

