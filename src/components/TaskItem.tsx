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

interface TaskItemProps {
  task: Task;
  linkedGoal: Goal | null;
  hideGoalName?: boolean;
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

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  linkedGoal,
  hideGoalName = false,
  onUpdateTaskStatus,
  onEditTask,
  onDeleteTask,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onEditSubtask,
  onDeleteSubtask,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [isAddingRootSubtask, setIsAddingRootSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  // Por padrão herda a data de vencimento da tarefa superior
  const [subtaskDueDate, setSubtaskDueDate] = useState<string>(task.dueDate || '');

  const isCompleted = task.status === 'concluida';
  const isInProgress = task.status === 'em_andamento';
  const subtaskStats = countSubtasksRecursive(task.subtasks);

  const handleOpenAddSubtask = () => {
    setSubtaskTitle('');
    setSubtaskDueDate(task.dueDate || '');
    setIsAddingRootSubtask(true);
    setShowSubtasks(true);
  };

  const handleCreateRootSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = subtaskTitle.trim();
    if (!trimmed) return;
    onAddSubtask(
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
    onUpdateTaskStatus(task.id, nextStatus);
  };

  return (
    <div className="py-3.5 px-4 bg-white border border-stone-200/90 rounded-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={toggleMainCheckbox}
            className="mt-0.5 shrink-0 text-stone-400 hover:text-emerald-700 transition-colors"
            title={
              isCompleted
                ? 'Desmarcar conclusão da tarefa'
                : 'Marcar tarefa como concluída'
            }
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : isInProgress ? (
              <Clock className="w-5 h-5 text-amber-600" />
            ) : (
              <Circle className="w-5 h-5 text-stone-400" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div
              className={`text-sm sm:text-base font-medium leading-snug ${
                isCompleted ? 'line-through text-stone-400' : 'text-stone-900'
              }`}
            >
              {task.title}
            </div>

            {/* Metadados unboxed com separador tipográfico · */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 mt-1">
              <span
                className={
                  isCompleted
                    ? 'text-emerald-700 font-medium'
                    : isInProgress
                    ? 'text-amber-700 font-medium'
                    : 'text-stone-500'
                }
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>

              {linkedGoal && !hideGoalName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-stone-700 font-medium">
                    Meta: {linkedGoal.title}
                  </span>
                </>
              )}

              {!linkedGoal && !hideGoalName && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Tarefa avulsa (sem meta vinculada)</span>
                </>
              )}

              {linkedGoal && task.defaultValue > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular text-emerald-800 font-medium">
                    +{formatUnitValue(task.defaultValue, linkedGoal.unitType)} na meta
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

              {subtaskStats.total > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => setShowSubtasks(!showSubtasks)}
                    className="inline-flex items-center gap-1 font-mono-tabular text-stone-700 hover:text-emerald-700 underline-offset-2 hover:underline"
                  >
                    {showSubtasks ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    Subtarefas: {subtaskStats.completed}/{subtaskStats.total}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controles da Tarefa */}
        <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
          <select
            aria-label={`Status da tarefa ${task.title}`}
            value={task.status}
            onChange={(e) =>
              onUpdateTaskStatus(task.id, e.target.value as TaskStatus)
            }
            className="text-xs bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-700 focus:outline-none focus:border-emerald-600"
          >
            {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((st) => (
              <option key={st} value={st}>
                {TASK_STATUS_LABELS[st]}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleOpenAddSubtask}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-emerald-800 bg-stone-100 hover:bg-emerald-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Adicionar subtarefa"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Subtarefa</span>
          </button>

          <button
            type="button"
            onClick={() => onEditTask(task)}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title="Editar tarefa"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteTask(task.id)}
            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir tarefa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formulário para criar subtarefa de 1º nível (herdando data da tarefa por padrão) */}
      {isAddingRootSubtask && (
        <form
          onSubmit={handleCreateRootSubtask}
          className="mt-3 p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2"
        >
          <div className="text-xs font-medium text-stone-800">
            Adicionar subtarefa para "{task.title}"
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Ex.: Separar material de apoio..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-emerald-600"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={subtaskDueDate}
                onChange={(e) => setSubtaskDueDate(e.target.value)}
                title="Herda por padrão a data de vencimento da tarefa"
                className="px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-stone-200 rounded-lg text-stone-700"
              />
              <button
                type="button"
                onClick={() => setIsAddingRootSubtask(false)}
                className="px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Salvar subtarefa
              </button>
            </div>
          </div>
          <p className="text-[11px] text-stone-500">
            Por padrão, a data de vencimento herda a data da tarefa superior (
            <span className="font-mono-tabular">{formatDateBR(task.dueDate)}</span>).
          </p>
        </form>
      )}

      {/* Árvore Recursiva de Subtarefas */}
      {showSubtasks && task.subtasks.length > 0 && (
        <SubtaskTree
          taskId={task.id}
          subtasks={task.subtasks}
          parentDueDate={task.dueDate}
          level={0}
          onAddSubtask={onAddSubtask}
          onUpdateSubtaskStatus={onUpdateSubtaskStatus}
          onEditSubtask={onEditSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      )}
    </div>
  );
};
