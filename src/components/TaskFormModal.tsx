import React, { useState, useEffect } from 'react';
import { X, Link2, Calendar, Sparkles, CheckSquare } from 'lucide-react';
import {
  Goal,
  Task,
  TaskStatus,
  TASK_STATUS_LABELS,
  UNIT_TYPE_META,
} from '../models/types';
import { formatUnitValue } from '../utils/treeUtils';

interface TaskFormModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  defaultGoalId: string | null;
  goals: Goal[];
  onClose: () => void;
  onSave: (
    taskData: {
      title: string;
      goalId: string | null;
      dueDate: string | null;
      status: TaskStatus;
      defaultValue: number;
    },
    existingTaskId?: string
  ) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  editingTask,
  defaultGoalId,
  goals,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [goalId, setGoalId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('nao_iniciada');
  const [defaultValue, setDefaultValue] = useState<string>('60');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setGoalId(editingTask.goalId || '');
      setDueDate(editingTask.dueDate || '');
      setStatus(editingTask.status);
      setDefaultValue(String(editingTask.defaultValue));
    } else {
      const initialGoalId = defaultGoalId || '';
      setTitle('');
      setGoalId(initialGoalId);
      const selectedGoal = goals.find((g) => g.id === initialGoalId);
      setDueDate(selectedGoal?.deadline || new Date().toISOString().split('T')[0]);
      setStatus('nao_iniciada');
      if (selectedGoal) {
        const meta = UNIT_TYPE_META[selectedGoal.unitType];
        setDefaultValue(String(meta.exampleStep));
      } else {
        setDefaultValue('0');
      }
    }
    setError(null);
  }, [editingTask, defaultGoalId, goals, isOpen]);

  if (!isOpen) return null;

  const selectedGoal = goals.find((g) => g.id === goalId) || null;
  const selectedUnitMeta = selectedGoal ? UNIT_TYPE_META[selectedGoal.unitType] : null;

  const handleGoalChange = (newGoalId: string) => {
    setGoalId(newGoalId);
    if (!editingTask) {
      const found = goals.find((g) => g.id === newGoalId);
      if (found) {
        setDefaultValue(String(UNIT_TYPE_META[found.unitType].exampleStep));
      } else {
        setDefaultValue('0');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Informe um título para a tarefa.');
      return;
    }

    const numericDefault = goalId ? Number(defaultValue) : 0;
    if (goalId && (isNaN(numericDefault) || numericDefault < 0)) {
      setError('O valor padrão para a meta deve ser um número válido (zero ou positivo).');
      return;
    }

    onSave(
      {
        title: trimmedTitle,
        goalId: goalId || null,
        dueDate: dueDate.trim() ? dueDate.trim() : null,
        status,
        defaultValue: numericDefault,
      },
      editingTask?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2 id="task-modal-title" className="text-lg font-semibold text-stone-900">
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Vincule a um objetivo para somar progresso automaticamente ou crie uma tarefa avulsa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-stone-800 mb-1.5">
              Título da tarefa <span className="text-red-600">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Estudar bloco de exercícios de Estatística"
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="task-goal" className="block text-sm font-medium text-stone-800 mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-stone-400" />
                Objetivo vinculado <span className="text-stone-400 font-normal">(opcional)</span>
              </span>
            </label>
            <select
              id="task-goal"
              value={goalId}
              onChange={(e) => handleGoalChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-emerald-600 transition-colors"
            >
              <option value="">Sem vínculo (Tarefa avulsa da rotina)</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({UNIT_TYPE_META[g.unitType].shortLabel})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="task-due" className="block text-sm font-medium text-stone-800 mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  Data de vencimento
                </span>
              </label>
              <input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="task-status" className="block text-sm font-medium text-stone-800 mb-1.5">
                <span className="inline-flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-stone-400" />
                  Status da tarefa
                </span>
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:border-emerald-600 transition-colors"
              >
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {TASK_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedGoal && selectedUnitMeta && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <label
                htmlFor="task-default-value"
                className="block text-sm font-medium text-emerald-950"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  Valor padrão adicionado à meta ({selectedUnitMeta.shortLabel})
                </span>
              </label>
              <input
                id="task-default-value"
                type="number"
                min="0"
                step="any"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono-tabular bg-white border border-emerald-300 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-700 transition-colors"
              />
              <p className="text-xs text-emerald-800">
                Ao marcar esta tarefa como <strong>Concluída</strong>, serão adicionados{' '}
                <strong className="font-mono-tabular">
                  +{formatUnitValue(Number(defaultValue) || 0, selectedGoal.unitType)}
                </strong>{' '}
                ao objetivo <em>"{selectedGoal.title}"</em>.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              {editingTask ? 'Salvar tarefa' : 'Adicionar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
