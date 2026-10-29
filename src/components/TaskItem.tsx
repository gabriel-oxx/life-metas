import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  Goal,
  Task,
  TaskStatus,
  TASK_STATUS_LABELS,
} from '../models/types';
import {
  countSubtasksRecursive,
  formatDateBR,
  formatDateTimeBR,
  formatUnitValue,
} from '../utils/treeUtils';
import { SubtaskTree } from './SubtaskTree';
import { useTasks } from '../contexts/TaskContext';

interface TaskItemProps {
  task: Task;
  linkedGoal: Goal | null;
  hideGoalName?: boolean;
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

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  linkedGoal,
  hideGoalName = false,
  onUpdateTaskStatus: propOnUpdateTaskStatus,
  onEditTask,
  onDeleteTask: propOnDeleteTask,
  onAddSubtask: propOnAddSubtask,
  onUpdateSubtaskStatus: propOnUpdateSubtaskStatus,
  onEditSubtask: propOnEditSubtask,
  onDeleteSubtask: propOnDeleteSubtask,
}) => {
  const tasksContext = useTasks();

  const handleUpdateTaskStatus = (newStatus: TaskStatus) => {
    if (propOnUpdateTaskStatus) {
      propOnUpdateTaskStatus(task.id, newStatus);
    } else {
      tasksContext.updateTaskStatus(task.id, newStatus, linkedGoal?.title);
    }
  };

  const handleDeleteTask = () => {
    if (propOnDeleteTask) {
      propOnDeleteTask(task.id);
    } else {
      tasksContext.deleteTask(task.id);
    }
  };

  const handleAddSubtask = propOnAddSubtask || tasksContext.addSubtask;
  const handleUpdateSubtaskStatus = propOnUpdateSubtaskStatus || tasksContext.updateSubtaskStatus;
  const handleEditSubtask = propOnEditSubtask || tasksContext.editSubtask;
  const handleDeleteSubtask = propOnDeleteSubtask || tasksContext.deleteSubtask;
  // Por padrão fechada: exibe apenas checkbox, título da tarefa e número de subtarefas
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingRootSubtask, setIsAddingRootSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskDueDate, setSubtaskDueDate] = useState<string>(
    task.dueDate || ''
  );

  const isCompleted = task.status === 'concluida';
  const isInProgress = task.status === 'em_andamento';
  const subtaskStats = countSubtasksRecursive(task.subtasks);

  const handleOpenAddSubtask = () => {
    setSubtaskTitle('');
    setSubtaskDueDate(task.dueDate || '');
    setIsAddingRootSubtask(true);
    setIsOpen(true);
  };

  const handleCreateRootSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = subtaskTitle.trim();
    if (!trimmed) return;
    handleAddSubtask(
      task.id,
      task.id,
      trimmed,
      subtaskDueDate.trim() ? subtaskDueDate.trim() : task.dueDate
    );
    setSubtaskTitle('');
    setIsAddingRootSubtask(false);
  };

  const toggleMainCheckbox = () => {
    const nextStatus: TaskStatus = isCompleted ? 'nao_iniciada' : 'concluida';
    handleUpdateTaskStatus(nextStatus);
  };

  const taskDetailPanelId = `task-detail-panel-${task.id}`;
  const taskStatusSelectId = `task-status-select-${task.id}`;
  const rootSubtaskTitleInputId = `root-subtask-title-${task.id}`;
  const rootSubtaskDateInputId = `root-subtask-date-${task.id}`;
  const rootSubtaskHintId = `root-subtask-hint-${task.id}`;

  const subtaskCountLabel =
    subtaskStats.total > 0
      ? `${subtaskStats.completed}/${subtaskStats.total} subtarefas`
      : '0 subtarefas';

  return (
    <div
      className={`bg-white border rounded-xl transition-colors ${
        isOpen
          ? 'border-emerald-600/60 shadow-xs'
          : 'border-stone-200/90 hover:border-stone-300'
      }`}
    >
      {/* Linha principal enxuta: APENAS Checkbox + Botão da Tarefa (Título e Número de Subtarefas) */}
      <div className="flex items-center gap-3 py-3 px-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={isCompleted}
          aria-label={`Concluir tarefa: ${task.title}`}
          onClick={toggleMainCheckbox}
          className="shrink-0 text-stone-400 hover:text-emerald-700 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2
              className="w-5 h-5 text-emerald-600"
              aria-hidden="true"
            />
          ) : isInProgress ? (
            <Clock className="w-5 h-5 text-amber-600" aria-hidden="true" />
          ) : (
            <Circle className="w-5 h-5 text-stone-400" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={taskDetailPanelId}
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left rounded-lg py-0.5 px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          <span
            className={`text-sm sm:text-base font-medium leading-snug truncate ${
              isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
            }`}
          >
            {task.title}
          </span>

          <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular text-stone-500 shrink-0">
            <span>{subtaskCountLabel}</span>
            {isOpen ? (
              <ChevronDown
                className="w-4 h-4 text-stone-400"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                className="w-4 h-4 text-stone-400"
                aria-hidden="true"
              />
            )}
          </span>
        </button>
      </div>

      {/* Painel Interno da Tarefa: exibido apenas quando a tarefa é selecionada (clique ou Enter) */}
      {isOpen && (
        <div
          id={taskDetailPanelId}
          role="region"
          aria-label={`Detalhes e controles da tarefa ${task.title}`}
          className="px-4 pb-4 pt-3 border-t border-stone-100 space-y-3.5 bg-stone-50/40 rounded-b-xl"
        >
          {/* Metadados detalhados da tarefa */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
            <span
              className={
                isCompleted
                  ? 'text-emerald-700 font-medium'
                  : isInProgress
                  ? 'text-amber-700 font-medium'
                  : 'text-stone-600 font-medium'
              }
            >
              Status: {TASK_STATUS_LABELS[task.status]}
            </span>

            {linkedGoal && !hideGoalName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-stone-700 font-medium">
                  Objetivo: {linkedGoal.title}
                </span>
              </>
            )}

            {!linkedGoal && !hideGoalName && (
              <>
                <span aria-hidden="true">·</span>
                <span>Tarefa avulsa (sem objetivo vinculado)</span>
              </>
            )}

            {linkedGoal && task.defaultValue > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-emerald-800 font-medium">
                  +{formatUnitValue(task.defaultValue, linkedGoal.unitType)} no
                  objetivo
                </span>
              </>
            )}

            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              Vencimento: {formatDateBR(task.dueDate)}
            </span>

            {task.completedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-emerald-700">
                  Concluída em {formatDateTimeBR(task.completedAt)}
                </span>
              </>
            )}
          </div>

          {/* Controles da Tarefa (exclusivos dentro da tarefa aberta) */}
          <div
            role="group"
            aria-label={`Ações da tarefa ${task.title}`}
            className="flex flex-wrap items-center gap-2 pt-1"
          >
            <div className="flex items-center gap-1.5">
              <label
                htmlFor={taskStatusSelectId}
                className="text-xs font-medium text-stone-600"
              >
                Mudar status:
              </label>
              <select
                id={taskStatusSelectId}
                value={task.status}
                onChange={(e) =>
                  handleUpdateTaskStatus(e.target.value as TaskStatus)
                }
                className="text-xs bg-white border border-stone-200 hover:border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {TASK_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddSubtask}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Adicionar subtarefa</span>
            </button>

            <button
              type="button"
              onClick={() => onEditTask?.(task)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Editar tarefa</span>
            </button>

            <button
              type="button"
              onClick={handleDeleteTask}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Excluir tarefa</span>
            </button>
          </div>

          {/* Formulário para criar subtarefa de 1º nível */}
          {isAddingRootSubtask && (
            <form
              onSubmit={handleCreateRootSubtask}
              aria-label={`Adicionar subtarefa para ${task.title}`}
              className="p-3.5 bg-white border border-stone-200 rounded-xl space-y-2"
            >
              <div className="text-xs font-medium text-stone-800">
                Nova subtarefa para "{task.title}"
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor={rootSubtaskTitleInputId} className="sr-only">
                  Título da subtarefa para {task.title}
                </label>
                <input
                  id={rootSubtaskTitleInputId}
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  placeholder="Ex.: Separar material de apoio..."
                  aria-describedby={rootSubtaskHintId}
                  className="flex-1 px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700"
                  autoFocus
                />
                <div className="flex items-center gap-1.5">
                  <label htmlFor={rootSubtaskDateInputId} className="sr-only">
                    Data de vencimento da subtarefa
                  </label>
                  <input
                    id={rootSubtaskDateInputId}
                    type="date"
                    value={subtaskDueDate}
                    onChange={(e) => setSubtaskDueDate(e.target.value)}
                    aria-describedby={rootSubtaskHintId}
                    className="px-2.5 py-1.5 text-xs font-mono-tabular bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingRootSubtask(false)}
                    className="px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    Salvar subtarefa
                  </button>
                </div>
              </div>
              <p id={rootSubtaskHintId} className="text-[11px] text-stone-500">
                Por padrão, a data de vencimento herda a data da tarefa superior
                (
                <span className="font-mono-tabular">
                  {formatDateBR(task.dueDate)}
                </span>
                ).
              </p>
            </form>
          )}

          {/* Árvore Recursiva de Subtarefas */}
          {task.subtasks.length > 0 && (
            <SubtaskTree
              taskId={task.id}
              subtasks={task.subtasks}
              parentDueDate={task.dueDate}
              level={0}
              parentTitle={task.title}
            />
          )}
        </div>
      )}
    </div>
  );
};
