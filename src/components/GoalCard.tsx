import React, { useState } from 'react';
import {
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  PauseCircle,
  Archive,
  PlayCircle,
} from 'lucide-react';
import {
  GoalWithProgress,
  GoalStatus,
  Task,
  TaskStatus,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
} from '../models/types';
import { formatDateBR, formatUnitValue } from '../utils/treeUtils';
import { TaskItem } from './TaskItem';

interface GoalCardProps {
  goal: GoalWithProgress;
  linkedTasks: Task[];
  onEditGoal: (goal: GoalWithProgress) => void;
  onDeleteGoal: (goal: GoalWithProgress) => void;
  onChangeGoalStatus: (goalId: string, newStatus: GoalStatus) => void;
  onOpenNewTaskForGoal: (goalId: string) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (
    taskId: string,
    parentId: string,
    title: string,
    dueDate: string | null
  ) => void;
  onUpdateSubtaskStatus: (
    taskId: string,
    subtaskId: string,
    newStatus: TaskStatus
  ) => void;
  onEditSubtask: (
    taskId: string,
    subtaskId: string,
    updates: { title: string; dueDate: string | null; status: TaskStatus }
  ) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  linkedTasks,
  onEditGoal,
  onDeleteGoal,
  onChangeGoalStatus,
  onOpenNewTaskForGoal,
  onUpdateTaskStatus,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onEditSubtask,
  onDeleteSubtask,
}) => {
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);

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
        return <PlayCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />;
      case 'concluido':
        return <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />;
      case 'pausado':
        return <PauseCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />;
      case 'arquivado':
        return <Archive className="w-3.5 h-3.5 text-stone-500 shrink-0" />;
    }
  };

  return (
    <article className="bg-white border border-stone-200/90 rounded-2xl p-6 flex flex-col justify-between transition-colors hover:border-stone-300">
      <div>
        {/* Cabeçalho do Cartão: Kicker limpo sem pílulas (Zero-Pill Discipline) + Ações */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 mb-1.5">
              <span className="font-medium text-stone-700">
                {GOAL_CATEGORY_LABELS[goal.category]}
              </span>
              <span aria-hidden="true">·</span>
              <span className={`inline-flex items-center gap-1 ${getStatusTextColor(goal.status)}`}>
                {getStatusIcon(goal.status)}
                {GOAL_STATUS_LABELS[goal.status]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {goal.deadline ? `Prazo: ${formatDateBR(goal.deadline)}` : 'Sem prazo final'}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-stone-900 leading-snug">
              {goal.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEditGoal(goal)}
              className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
              title="Editar objetivo"
              aria-label={`Editar objetivo ${goal.title}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDeleteGoal(goal)}
              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir objetivo"
              aria-label={`Excluir objetivo ${goal.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Progresso Gamificada (Efeito do Gradiente de Meta) */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <div>
              <span className="text-xs text-stone-500 block">Progresso acumulado</span>
              <span className="text-base font-semibold font-mono-tabular text-stone-900">
                {formatUnitValue(goal.currentValue, goal.unitType)}
              </span>{' '}
              <span className="text-xs font-mono-tabular text-stone-500">
                de {formatUnitValue(goal.targetValue, goal.unitType)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold font-mono-tabular text-emerald-800">
                {goal.progressPercent}%
              </span>
            </div>
          </div>

          <div
            className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={goal.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
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

          {/* Metadados de criação e contagem de etapas */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-stone-500">
            <div className="flex items-center gap-1.5 font-mono-tabular">
              <span>
                {goal.completedTasksCount}/{goal.linkedTasksCount} etapas concluídas
              </span>
              <span aria-hidden="true">·</span>
              <span>Criado em {formatDateBR(goal.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor={`status-select-${goal.id}`} className="sr-only">
                Alterar status do objetivo
              </label>
              <select
                id={`status-select-${goal.id}`}
                value={goal.status}
                onChange={(e) =>
                  onChangeGoalStatus(goal.id, e.target.value as GoalStatus)
                }
                className="text-xs bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-lg px-2 py-1 text-stone-700 focus:outline-none focus:border-emerald-600"
              >
                {(Object.keys(GOAL_STATUS_LABELS) as GoalStatus[]).map((st) => (
                  <option key={st} value={st}>
                    Status: {GOAL_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé do Cartão: Ações de Tarefas Vinculadas */}
      <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsTasksExpanded(!isTasksExpanded)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 hover:text-stone-950 transition-colors whitespace-nowrap shrink-0"
        >
          {isTasksExpanded ? (
            <>
              <ChevronUp className="w-4 h-4 text-stone-400" />
              <span>Ocultar etapas ({linkedTasks.length})</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-stone-400" />
              <span>Ver etapas vinculadas ({linkedTasks.length})</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsTasksExpanded(true);
            onOpenNewTaskForGoal(goal.id);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova tarefa na meta</span>
        </button>
      </div>

      {/* Lista expansível de tarefas e subtarefas vinculadas diretamente ao objetivo */}
      {isTasksExpanded && (
        <div className="mt-4 pt-3 border-t border-stone-100 space-y-2.5">
          {linkedTasks.length === 0 ? (
            <div className="py-5 px-4 text-center bg-stone-50/70 rounded-xl border border-stone-200/60">
              <p className="text-xs text-stone-600">
                Nenhuma tarefa vinculada a este objetivo ainda.
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Divida sua meta em tarefas menores para avançar com consistência.
              </p>
              <button
                type="button"
                onClick={() => onOpenNewTaskForGoal(goal.id)}
                className="mt-2.5 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar primeira tarefa</span>
              </button>
            </div>
          ) : (
            linkedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                linkedGoal={goal}
                hideGoalName={true}
                onUpdateTaskStatus={onUpdateTaskStatus}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                onAddSubtask={onAddSubtask}
                onUpdateSubtaskStatus={onUpdateSubtaskStatus}
                onEditSubtask={onEditSubtask}
                onDeleteSubtask={onDeleteSubtask}
              />
            ))
          )}
        </div>
      )}
    </article>
  );
};
