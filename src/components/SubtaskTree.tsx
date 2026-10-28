import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Subtask, TaskStatus, TASK_STATUS_LABELS } from '../models/types';
import {
  countSubtasksRecursive,
  formatDateBR,
  formatDateTimeBR,
} from '../utils/treeUtils';

interface SubtaskTreeProps {
  taskId: string;
  subtasks: Subtask[];
  parentDueDate: string | null;
  level?: number;
  parentTitle?: string;
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

export const SubtaskTree: React.FC<SubtaskTreeProps> = ({
  taskId,
  subtasks,
  parentDueDate,
  level = 0,
  parentTitle,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onEditSubtask,
  onDeleteSubtask,
}) => {
  if (!subtasks || subtasks.length === 0) return null;

  return (
    <ul
      role="list"
      aria-label={
        parentTitle
          ? `Subtarefas de ${parentTitle} (Nível ${level + 1})`
          : `Subtarefas de nível ${level + 1}`
      }
      className={`space-y-2 ${
        level === 0
          ? 'pt-2 border-t border-stone-200/70'
          : 'mt-2 pl-4 sm:pl-6 border-l border-stone-200/90'
      }`}
    >
      {subtasks.map((sub) => (
        <li key={sub.id}>
          <SubtaskNode
            taskId={taskId}
            subtask={sub}
            parentDueDate={parentDueDate}
            level={level}
            onAddSubtask={onAddSubtask}
            onUpdateSubtaskStatus={onUpdateSubtaskStatus}
            onEditSubtask={onEditSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        </li>
      ))}
    </ul>
  );
};

interface SubtaskNodeProps {
  taskId: string;
  subtask: Subtask;
  parentDueDate: string | null;
  level: number;
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

const SubtaskNode: React.FC<SubtaskNodeProps> = ({
  taskId,
  subtask,
  level,
  onAddSubtask,
  onUpdateSubtaskStatus,
  onEditSubtask,
  onDeleteSubtask,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [childDueDate, setChildDueDate] = useState<string>(
    subtask.dueDate || ''
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [editDueDate, setEditDueDate] = useState<string>(subtask.dueDate || '');
  const [editStatus, setEditStatus] = useState<TaskStatus>(subtask.status);

  const childStats = countSubtasksRecursive(subtask.subtasks);

  const openAddChild = () => {
    setChildTitle('');
    setChildDueDate(subtask.dueDate || '');
    setIsAddingChild(true);
    setIsOpen(true);
  };

  const handleCreateChild = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = childTitle.trim();
    if (!trimmed) return;
    onAddSubtask(
      taskId,
      subtask.id,
      trimmed,
      childDueDate.trim() ? childDueDate.trim() : subtask.dueDate
    );
    setChildTitle('');
    setIsAddingChild(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    onEditSubtask(taskId, subtask.id, {
      title: trimmed,
      dueDate: editDueDate.trim() ? editDueDate.trim() : null,
      status: editStatus,
    });
    setIsEditing(false);
  };

  const cycleStatus = () => {
    const nextStatus: TaskStatus =
      subtask.status === 'concluida' ? 'nao_iniciada' : 'concluida';
    onUpdateSubtaskStatus(taskId, subtask.id, nextStatus);
  };

  const isCompleted = subtask.status === 'concluida';
  const isInProgress = subtask.status === 'em_andamento';

  const subtaskPanelId = `subtask-panel-${subtask.id}`;
  const subtaskStatusSelectId = `subtask-status-${subtask.id}`;
  const editTitleId = `edit-subtask-title-${subtask.id}`;
  const childTitleId = `child-subtask-title-${subtask.id}`;
  const childDateId = `child-subtask-date-${subtask.id}`;
  const childHintId = `child-subtask-hint-${subtask.id}`;

  const childCountLabel =
    childStats.total > 0
      ? `${childStats.completed}/${childStats.total} sub-etapas`
      : '0 sub-etapas';

  return (
    <div className="bg-white border border-stone-200/80 rounded-lg px-3 py-2">
      {/* Linha enxuta da subtarefa: Checkbox + Título e contagem de sub-etapas */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={isCompleted}
          aria-label={`Concluir subtarefa: ${subtask.title}`}
          onClick={cycleStatus}
          className="shrink-0 text-stone-400 hover:text-emerald-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2
              className="w-4 h-4 text-emerald-600"
              aria-hidden="true"
            />
          ) : isInProgress ? (
            <Clock className="w-4 h-4 text-amber-600" aria-hidden="true" />
          ) : (
            <Circle className="w-4 h-4 text-stone-400" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={subtaskPanelId}
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left rounded py-0.5 px-1 -mx-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
        >
          <span
            className={`text-xs sm:text-sm leading-snug truncate ${
              isCompleted
                ? 'line-through text-stone-400'
                : 'text-stone-800 font-medium'
            }`}
          >
            {subtask.title}
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] font-mono-tabular text-stone-500 shrink-0">
            <span>{childCountLabel}</span>
            {isOpen ? (
              <ChevronDown
                className="w-3.5 h-3.5 text-stone-400"
                aria-hidden="true"
              />
            ) : (
              <ChevronRight
                className="w-3.5 h-3.5 text-stone-400"
                aria-hidden="true"
              />
            )}
          </span>
        </button>
      </div>

      {/* Detalhes e controles internos da subtarefa (apenas quando selecionada) */}
      {isOpen && (
        <div
          id={subtaskPanelId}
          className="mt-2.5 pt-2.5 border-t border-stone-100 space-y-2.5"
        >
          {isEditing ? (
            <form
              onSubmit={handleSaveEdit}
              aria-label={`Editar subtarefa ${subtask.title}`}
              className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5"
            >
              <div className="text-xs font-medium text-stone-700">
                Editando subtarefa (Nível {level + 1})
              </div>
              <label htmlFor={editTitleId} className="sr-only">
                Título da subtarefa
              </label>
              <input
                id={editTitleId}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                placeholder="Título da subtarefa"
                autoFocus
              />
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-stone-600 flex items-center gap-1.5">
                  <span>Vencimento:</span>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="px-2.5 py-1 text-xs font-mono-tabular bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </label>
                <label className="text-xs text-stone-600 flex items-center gap-1.5">
                  <span>Status:</span>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as TaskStatus)
                    }
                    className="px-2.5 py-1 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map(
                      (st) => (
                        <option key={st} value={st}>
                          {TASK_STATUS_LABELS[st]}
                        </option>
                      )
                    )}
                  </select>
                </label>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500">
                <span>Nível {level + 1}</span>
                <span aria-hidden="true">·</span>
                <span>Status: {TASK_STATUS_LABELS[subtask.status]}</span>
                {subtask.dueDate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      Vence: {formatDateBR(subtask.dueDate)}
                    </span>
                  </>
                )}
                {subtask.completedAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-mono-tabular">
                      Concluída em {formatDateTimeBR(subtask.completedAt)}
                    </span>
                  </>
                )}
              </div>

              <div
                role="group"
                aria-label={`Controles da subtarefa ${subtask.title}`}
                className="flex flex-wrap items-center gap-1.5"
              >
                <div className="flex items-center gap-1">
                  <label
                    htmlFor={subtaskStatusSelectId}
                    className="text-[11px] text-stone-600"
                  >
                    Status:
                  </label>
                  <select
                    id={subtaskStatusSelectId}
                    value={subtask.status}
                    onChange={(e) =>
                      onUpdateSubtaskStatus(
                        taskId,
                        subtask.id,
                        e.target.value as TaskStatus
                      )
                    }
                    className="text-[11px] bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-md px-2 py-1 text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map(
                      (st) => (
                        <option key={st} value={st}>
                          {TASK_STATUS_LABELS[st]}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openAddChild}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <Plus className="w-3 h-3" aria-hidden="true" />
                  <span>Nova sub-etapa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(subtask.title);
                    setEditDueDate(subtask.dueDate || '');
                    setEditStatus(subtask.status);
                    setIsEditing(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <Pencil className="w-3 h-3" aria-hidden="true" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteSubtask(taskId, subtask.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                  <span>Excluir</span>
                </button>
              </div>
            </>
          )}

          {/* Formulário inline para adicionar subtarefa filha */}
          {isAddingChild && (
            <form
              onSubmit={handleCreateChild}
              aria-label={`Adicionar sub-etapa dentro de ${subtask.title}`}
              className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2"
            >
              <div className="text-xs font-medium text-stone-700">
                Nova subtarefa dentro de "{subtask.title}" (Nível {level + 2})
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <label htmlFor={childTitleId} className="sr-only">
                  Título da nova sub-etapa dentro de {subtask.title}
                </label>
                <input
                  id={childTitleId}
                  type="text"
                  value={childTitle}
                  onChange={(e) => setChildTitle(e.target.value)}
                  placeholder="Descreva a sub-etapa..."
                  aria-describedby={childHintId}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  autoFocus
                />
                <div className="flex items-center gap-1.5">
                  <label htmlFor={childDateId} className="sr-only">
                    Data de vencimento da sub-etapa
                  </label>
                  <input
                    id={childDateId}
                    type="date"
                    value={childDueDate}
                    onChange={(e) => setChildDueDate(e.target.value)}
                    aria-describedby={childHintId}
                    className="px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingChild(false)}
                    className="px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
              <p id={childHintId} className="text-[11px] text-stone-500">
                Data de vencimento preenchida automaticamente a partir da
                subtarefa superior (
                <span className="font-mono-tabular">
                  {formatDateBR(subtask.dueDate)}
                </span>
                ).
              </p>
            </form>
          )}

          {/* Renderização Recursiva para N níveis */}
          {subtask.subtasks.length > 0 && (
            <SubtaskTree
              taskId={taskId}
              subtasks={subtask.subtasks}
              parentDueDate={subtask.dueDate}
              level={level + 1}
              parentTitle={subtask.title}
              onAddSubtask={onAddSubtask}
              onUpdateSubtaskStatus={onUpdateSubtaskStatus}
              onEditSubtask={onEditSubtask}
              onDeleteSubtask={onDeleteSubtask}
            />
          )}
        </div>
      )}
    </div>
  );
};
