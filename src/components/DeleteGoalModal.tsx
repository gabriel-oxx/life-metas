import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { GoalWithProgress } from '../models/types';
import { useModalA11y } from '../utils/useModalA11y';

interface DeleteGoalModalProps {
  goal: GoalWithProgress | null;
  onClose: () => void;
  onConfirmDelete: (goalId: string, deleteLinkedTasks: boolean) => void;
}

export const DeleteGoalModal: React.FC<DeleteGoalModalProps> = ({
  goal,
  onClose,
  onConfirmDelete,
}) => {
  const [deleteLinkedTasks, setDeleteLinkedTasks] = useState(false);

  const modalRef = useModalA11y(Boolean(goal), onClose);

  if (!goal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-goal-title"
      aria-describedby="delete-goal-desc"
    >
      <div
        ref={modalRef}
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-md overflow-hidden shadow-xl p-6 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-red-700">
            <AlertTriangle
              className="w-5 h-5 shrink-0"
              aria-hidden="true"
            />
            <h2
              id="delete-goal-title"
              className="text-base font-semibold text-stone-900"
            >
              Excluir objetivo
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            aria-label="Fechar janela de confirmação"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <p
          id="delete-goal-desc"
          className="text-sm text-stone-600 leading-relaxed"
        >
          Tem certeza de que deseja excluir o objetivo{' '}
          <strong className="text-stone-900">"{goal.title}"</strong>? Esta ação
          não pode ser desfeita.
        </p>

        {goal.linkedTasksCount > 0 && (
          <fieldset className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
            <legend className="text-xs font-medium text-stone-800 px-1">
              Este objetivo possui {goal.linkedTasksCount} tarefa(s)
              vinculada(s). O que deseja fazer com elas?
            </legend>
            <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="radio"
                name="task-handling"
                checked={!deleteLinkedTasks}
                onChange={() => setDeleteLinkedTasks(false)}
                className="mt-0.5 accent-emerald-700"
              />
              <span>
                <strong>Manter tarefas como avulsas</strong> (apenas remove o
                vínculo com este objetivo)
              </span>
            </label>
            <label className="flex items-start gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="radio"
                name="task-handling"
                checked={deleteLinkedTasks}
                onChange={() => setDeleteLinkedTasks(true)}
                className="mt-0.5 accent-red-600"
              />
              <span>
                <strong>Excluir também as tarefas vinculadas</strong> e suas
                subtarefas
              </span>
            </label>
          </fieldset>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDelete(goal.id, deleteLinkedTasks);
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            Confirmar exclusão
          </button>
        </div>
      </div>
    </div>
  );
};
