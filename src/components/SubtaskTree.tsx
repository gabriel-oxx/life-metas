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
  CornerDownRight,
} from 'lucide-react';
import { Subtask, TaskStatus, TASK_STATUS_LABELS } from '../models/types';
import { formatDateBR, formatDateTimeBR } from '../utils/treeUtils';

interface SubtaskTreeProps {
  taskId: string;
  subtasks: Subtask[];
  parentDueDate: string | null;
  level?: number;
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
  onAddSubtask,
  onUpdateSubtaskStatus,
  onEditSubtask,
  onDeleteSubtask,
}) => {
  if (!subtasks || subtasks.length === 0) return null;

  return (
    <div
      className={`space-y-1.5 ${
        level === 0
          ? 'mt-3 pt-2.5 border-t border-stone-100'
          : 'mt-1.5 pl-4 sm:pl-6 border-l border-stone-200/90'
      }`}
    >
      {subtasks.map((sub) => (
        <SubtaskNode
          key={sub.id}
          taskId={taskId}
          subtask={sub}
          parentDueDate={parentDueDate}
          level={level}
          onAddSubtask={onAddSubtask}
          onUpdateSubtaskStatus={onUpdateSubtaskStatus}
          onEditSubtask={onEditSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      ))}
    </div>
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
  const [expanded, setExpanded] = useState(true);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  // Regra: por padrão a data de vencimento da subtarefa é a data da tarefa ou subtarefa de nível superior
  const [childDueDate, setChildDueDate] = useState<string>(subtask.dueDate || '');

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [editDueDate, setEditDueDate] = useState<string>(subtask.dueDate || '');
  const [editStatus, setEditStatus] = useState<TaskStatus>(subtask.status);

  const openAddChild = () => {
    setChildTitle('');
    setChildDueDate(subtask.dueDate || '');
    setIsAddingChild(true);
    setExpanded(true);
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

  return (
    <div className="group/sub">
      {isEditing ? (
        <form
          onSubmit={handleSaveEdit}
          className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5"
        >
          <div className="text-xs font-medium text-stone-700">
            Editando subtarefa (Nível {level + 1})
          </div>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-emerald-600"
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
                className="px-2.5 py-1 text-xs font-mono-tabular bg-white border border-stone-200 rounded-lg"
              />
            </label>
            <label className="text-xs text-stone-600 flex items-center gap-1.5">
              <span>Status:</span>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                className="px-2.5 py-1 text-xs bg-white border border-stone-200 rounded-lg"
              >
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {TASK_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </label>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-stone-100/70 transition-colors">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            {subtask.subtasks.length > 0 ? (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="mt-0.5 p-0.5 text-stone-400 hover:text-stone-700 rounded transition-colors"
                aria-label={expanded ? 'Recolher subtarefas' : 'Expandir subtarefas'}
              >
                {expanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <CornerDownRight className="w-3.5 h-3.5 mt-1 text-stone-300 shrink-0" />
            )}

            <button
              type="button"
              onClick={cycleStatus}
              className="mt-0.5 shrink-0 text-stone-400 hover:text-emerald-700 transition-colors"
              title={
                isCompleted
                  ? 'Desmarcar conclusão da subtarefa'
                  : 'Marcar subtarefa como concluída'
              }
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : isInProgress ? (
                <Clock className="w-4 h-4 text-amber-600" />
              ) : (
                <Circle className="w-4 h-4 text-stone-400" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div
                className={`text-xs sm:text-sm leading-snug ${
                  isCompleted
                    ? 'line-through text-stone-400'
                    : 'text-stone-800 font-medium'
                }`}
              >
                {subtask.title}
              </div>

              {/* Metadados da subtarefa sem pílulas (Zero-Pill discipline) */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                <span>Nível {level + 1}</span>
                <span aria-hidden="true">·</span>
                <span>{TASK_STATUS_LABELS[subtask.status]}</span>
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
            </div>
          </div>

          {/* Controles funcionais da subtarefa */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label={`Alterar status da subtarefa ${subtask.title}`}
              value={subtask.status}
              onChange={(e) =>
                onUpdateSubtaskStatus(
                  taskId,
                  subtask.id,
                  e.target.value as TaskStatus
                )
              }
              className="text-[11px] bg-transparent border border-stone-200 hover:border-stone-300 rounded-md px-1.5 py-0.5 text-stone-600 focus:outline-none focus:border-emerald-600"
            >
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((st) => (
                <option key={st} value={st}>
                  {TASK_STATUS_LABELS[st]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={openAddChild}
              className="p-1 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
              title="Adicionar sub-etapa dentro desta subtarefa"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditTitle(subtask.title);
                setEditDueDate(subtask.dueDate || '');
                setEditStatus(subtask.status);
                setIsEditing(true);
              }}
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
              title="Editar subtarefa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteSubtask(taskId, subtask.id)}
              className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Excluir subtarefa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Formulário inline para adicionar subtarefa filha (Nível N + 1) */}
      {isAddingChild && (
        <form
          onSubmit={handleCreateChild}
          className="mt-1.5 ml-6 p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2"
        >
          <div className="text-xs font-medium text-stone-700">
            Nova subtarefa dentro de "{subtask.title}" (Nível {level + 2})
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={childTitle}
              onChange={(e) => setChildTitle(e.target.value)}
              placeholder="Descreva a sub-etapa..."
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-emerald-600"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={childDueDate}
                onChange={(e) => setChildDueDate(e.target.value)}
                title="Herda por padrão a data de vencimento do nível superior"
                className="px-2.5 py-1.5 text-xs font-mono-tabular bg-white border border-stone-200 rounded-lg text-stone-700"
              />
              <button
                type="button"
                onClick={() => setIsAddingChild(false)}
                className="px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Adicionar
              </button>
            </div>
          </div>
          <p className="text-[11px] text-stone-500">
            Data de vencimento preenchida automaticamente a partir da subtarefa superior (
            <span className="font-mono-tabular">{formatDateBR(subtask.dueDate)}</span>).
          </p>
        </form>
      )}

      {/* Renderização Recursiva para N níveis */}
      {expanded && subtask.subtasks.length > 0 && (
        <SubtaskTree
          taskId={taskId}
          subtasks={subtask.subtasks}
          parentDueDate={subtask.dueDate}
          level={level + 1}
          onAddSubtask={onAddSubtask}
          onUpdateSubtaskStatus={onUpdateSubtaskStatus}
          onEditSubtask={onEditSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      )}
    </div>
  );
};
