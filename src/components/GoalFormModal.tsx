import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Calendar,
  Target,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  Goal,
  GoalCategory,
  GoalStatus,
  UnitType,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
  UNIT_TYPE_META,
} from '../models/types';
import { formatUnitValue } from '../utils/treeUtils';
import { useModalA11y } from '../utils/useModalA11y';

interface GoalFormModalProps {
  isOpen: boolean;
  editingGoal: Goal | null;
  onClose: () => void;
  onSave: (
    goalData: Omit<Goal, 'id' | 'createdAt'>,
    existingId?: string
  ) => void;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  editingGoal,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('educacao');
  const [unitType, setUnitType] = useState<UnitType>('minutos');
  const [targetValue, setTargetValue] = useState<string>('1200');
  const [deadline, setDeadline] = useState<string>('');
  const [status, setStatus] = useState<GoalStatus>('ativo');
  const [error, setError] = useState<string | null>(null);

  const modalRef = useModalA11y(isOpen, onClose);

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setCategory(editingGoal.category);
      setUnitType(editingGoal.unitType);
      setTargetValue(String(editingGoal.targetValue));
      setDeadline(editingGoal.deadline || '');
      setStatus(editingGoal.status);
    } else {
      setTitle('');
      setCategory('educacao');
      setUnitType('minutos');
      setTargetValue('1200');
      setDeadline('');
      setStatus('ativo');
    }
    setError(null);
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const handleUnitTypeChange = (newUnit: UnitType) => {
    setUnitType(newUnit);
    if (!editingGoal) {
      setTargetValue(String(UNIT_TYPE_META[newUnit].exampleTarget));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Informe um título claro para o seu objetivo.');
      return;
    }

    const numericTarget = Number(targetValue);
    if (isNaN(numericTarget) || numericTarget <= 0) {
      setError('O valor alvo deve ser um número maior que zero.');
      return;
    }

    onSave(
      {
        title: trimmedTitle,
        category,
        unitType,
        targetValue: numericTarget,
        deadline: deadline.trim() ? deadline.trim() : null,
        status,
      },
      editingGoal?.id
    );
    onClose();
  };

  const currentUnitMeta = UNIT_TYPE_META[unitType];
  const previewTarget =
    Number(targetValue) > 0
      ? Number(targetValue)
      : currentUnitMeta.exampleTarget;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
      aria-describedby="goal-modal-desc"
    >
      <div
        ref={modalRef}
        className="bg-white border border-stone-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-xl my-8"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
          <div>
            <h2
              id="goal-modal-title"
              className="text-lg font-semibold text-stone-900"
            >
              {editingGoal ? 'Editar Objetivo' : 'Novo Objetivo'}
            </h2>
            <p id="goal-modal-desc" className="text-xs text-stone-500 mt-0.5">
              Transforme uma intenção abstrata em uma meta mensurável e
              progressiva.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            aria-label="Fechar janela de objetivo"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="goal-title"
              className="block text-sm font-medium text-stone-800 mb-1.5"
            >
              Título do objetivo{' '}
              <span className="text-red-600" aria-hidden="true">
                *
              </span>
            </label>
            <input
              id="goal-title"
              type="text"
              required
              aria-required="true"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Concluir o Trabalho de Conclusão de Curso (TCC)"
              className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700 transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="goal-category"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Compass
                    className="w-4 h-4 text-stone-400"
                    aria-hidden="true"
                  />
                  Categoria
                </span>
              </label>
              <select
                id="goal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700 transition-colors"
              >
                {(Object.keys(GOAL_CATEGORY_LABELS) as GoalCategory[]).map(
                  (catKey) => (
                    <option key={catKey} value={catKey}>
                      {GOAL_CATEGORY_LABELS[catKey]}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="goal-status"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2
                    className="w-4 h-4 text-stone-400"
                    aria-hidden="true"
                  />
                  Status
                </span>
              </label>
              <select
                id="goal-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700 transition-colors"
              >
                {(Object.keys(GOAL_STATUS_LABELS) as GoalStatus[]).map(
                  (statusKey) => (
                    <option key={statusKey} value={statusKey}>
                      {GOAL_STATUS_LABELS[statusKey]}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="goal-unit"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Layers
                    className="w-4 h-4 text-stone-400"
                    aria-hidden="true"
                  />
                  Tipo unitário (medida)
                </span>
              </label>
              <select
                id="goal-unit"
                value={unitType}
                onChange={(e) =>
                  handleUnitTypeChange(e.target.value as UnitType)
                }
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700 transition-colors"
              >
                {(Object.keys(UNIT_TYPE_META) as UnitType[]).map((uKey) => (
                  <option key={uKey} value={uKey}>
                    {UNIT_TYPE_META[uKey].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="goal-target"
                className="block text-sm font-medium text-stone-800 mb-1.5"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Target
                    className="w-4 h-4 text-stone-400"
                    aria-hidden="true"
                  />
                  Valor alvo ({currentUnitMeta.shortLabel}){' '}
                  <span className="text-red-600" aria-hidden="true">
                    *
                  </span>
                </span>
              </label>
              <input
                id="goal-target"
                type="number"
                required
                aria-required="true"
                min="1"
                step="any"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={`Ex.: ${currentUnitMeta.exampleTarget}`}
                aria-describedby="goal-progress-preview"
                className="w-full px-3.5 py-2.5 text-sm font-mono-tabular bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700 transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="goal-deadline"
              className="block text-sm font-medium text-stone-800 mb-1.5"
            >
              <span className="inline-flex items-center gap-1.5">
                <Calendar
                  className="w-4 h-4 text-stone-400"
                  aria-hidden="true"
                />
                Prazo final{' '}
                <span className="text-stone-400 font-normal">(opcional)</span>
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="goal-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-sm font-mono-tabular bg-stone-50/70 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700 transition-colors"
              />
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline('')}
                  className="px-3 py-2.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
                >
                  Limpar data
                </button>
              )}
            </div>
          </div>

          <div
            id="goal-progress-preview"
            className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-600 space-y-1"
          >
            <p className="font-medium text-stone-800">
              Como o progresso deste objetivo funcionará:
            </p>
            <p>
              Sua meta será atingir{' '}
              <span className="font-mono-tabular font-semibold text-emerald-800">
                {formatUnitValue(previewTarget, unitType)}
              </span>
              . Cada tarefa vinculada concluída somará seu valor padrão (por
              exemplo,{' '}
              <span className="font-mono-tabular font-medium text-stone-800">
                +{formatUnitValue(currentUnitMeta.exampleStep, unitType)}
              </span>
              ) diretamente na barra de progresso.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              {editingGoal ? 'Salvar alterações' : 'Criar objetivo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
