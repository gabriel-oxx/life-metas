import React from 'react';
import {
  CheckCircle2,
  PauseCircle,
  Archive,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import {
  GoalWithProgress,
  GoalStatus,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
} from '../models/types';
import { formatDateBR, formatUnitValue } from '../utils/treeUtils';

interface GoalCardProps {
  goal: GoalWithProgress;
  onSelectGoal: (goalId: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onSelectGoal }) => {
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
            className="w-3.5 h-3.5 text-emerald-700 shrink-0"
            aria-hidden="true"
          />
        );
      case 'concluido':
        return (
          <CheckCircle2
            className="w-3.5 h-3.5 text-teal-700 shrink-0"
            aria-hidden="true"
          />
        );
      case 'pausado':
        return (
          <PauseCircle
            className="w-3.5 h-3.5 text-amber-700 shrink-0"
            aria-hidden="true"
          />
        );
      case 'arquivado':
        return (
          <Archive
            className="w-3.5 h-3.5 text-stone-500 shrink-0"
            aria-hidden="true"
          />
        );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectGoal(goal.id);
    }
  };

  const progressText = `${goal.progressPercent}%, ${formatUnitValue(
    goal.currentValue,
    goal.unitType
  )} de ${formatUnitValue(goal.targetValue, goal.unitType)}`;

  return (
    <article
      id={`goal-card-${goal.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelectGoal(goal.id)}
      onKeyDown={handleKeyDown}
      aria-label={`Objetivo: ${goal.title}. Categoria: ${
        GOAL_CATEGORY_LABELS[goal.category]
      }. Status: ${
        GOAL_STATUS_LABELS[goal.status]
      }. Progresso: ${progressText}. ${goal.completedTasksCount} de ${
        goal.linkedTasksCount
      } etapas concluídas. Pressione Enter para abrir o painel deste objetivo e gerenciar tarefas, status ou edição.`}
      className="group bg-white border border-stone-200/90 rounded-2xl p-6 flex flex-col justify-between transition-all cursor-pointer hover:border-emerald-600/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 text-left"
    >
      <div>
        {/* Cabeçalho limpo: apenas metadados essenciais sem botões de ação sobrecarregando */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-500 mb-2">
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
        </div>

        <h3 className="text-lg font-semibold text-stone-900 leading-snug group-hover:text-emerald-900 transition-colors">
          {goal.title}
        </h3>
      </div>

      {/* Barra de Progresso Gamificada */}
      <div className="mt-5 pt-4 border-t border-stone-100">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <div>
            <span className="text-xs text-stone-500 block">
              Progresso acumulado
            </span>
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

        {/* Rodapé enxuto indicando etapas e convite para abrir o painel dedicado */}
        <div className="flex items-center justify-between gap-2 mt-3.5 text-xs text-stone-500">
          <span className="font-mono-tabular">
            {goal.completedTasksCount}/{goal.linkedTasksCount} etapas concluídas
          </span>

          <span
            className="inline-flex items-center gap-1 font-medium text-emerald-800 group-hover:translate-x-0.5 transition-transform"
            aria-hidden="true"
          >
            <span>Abrir objetivo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
