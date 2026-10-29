import React, { useState, useMemo, useEffect } from 'react';
import { Target, Search, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  GoalCategory,
  GoalStatus,
  GoalWithProgress,
  Task,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
} from '../models/types';
import { calculateGamificationStats } from '../utils/gamificationUtils';
import { GoalCard } from '../components/GoalCard';
import { GoalDetailPanel } from '../components/GoalDetailPanel';
import { useGoals } from '../contexts/GoalContext';
import { useTasks } from '../contexts/TaskContext';
import { useNotification } from '../contexts/NotificationContext';
import { INITIAL_GOALS } from '../data/initialData';

interface GoalsViewProps {
  onOpenNewGoalModal: () => void;
  onEditGoal: (goal: GoalWithProgress) => void;
  onDeleteGoal: (goal: GoalWithProgress) => void;
  onOpenNewTaskForGoal: (goalId: string) => void;
  onEditTask: (task: Task) => void;
  isGoalModalOpen: boolean;
  isTaskModalOpen: boolean;
  goalToDelete: GoalWithProgress | null;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  onOpenNewGoalModal,
  onEditGoal,
  onDeleteGoal,
  onOpenNewTaskForGoal,
  onEditTask,
  isGoalModalOpen,
  isTaskModalOpen,
  goalToDelete,
}) => {
  const {
    goals,
    goalsWithProgress,
    selectedGoalId,
    selectedGoal,
    setSelectedGoalId,
    resetGoals,
    clearGoals,
  } = useGoals();
  const { tasks, resetTasks, clearTasks } = useTasks();
  const { triggerFeedback } = useNotification();

  // Filtros locais de Objetivos
  const [goalStatusFilter, setGoalStatusFilter] = useState<GoalStatus | 'todos'>('todos');
  const [goalCategoryFilter, setGoalCategoryFilter] = useState<GoalCategory | 'todas'>('todas');
  const [goalSearch, setGoalSearch] = useState('');

  // Permite fechar o painel dedicado do objetivo com a tecla Escape quando nenhum modal está aberto
  useEffect(() => {
    if (
      !selectedGoalId ||
      isGoalModalOpen ||
      isTaskModalOpen ||
      Boolean(goalToDelete)
    ) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const previousId = selectedGoalId;
        setSelectedGoalId(null);
        setTimeout(() => {
          document.getElementById(`goal-card-${previousId}`)?.focus();
        }, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGoalId, isGoalModalOpen, isTaskModalOpen, goalToDelete, setSelectedGoalId]);

  // Pontuação Gamificada (XP Comportamental)
  const gamificationStats = useMemo(() => {
    return calculateGamificationStats(tasks, goalsWithProgress);
  }, [tasks, goalsWithProgress]);

  // Objetivos filtrados
  const filteredGoals = useMemo(() => {
    return goalsWithProgress.filter((g) => {
      if (goalStatusFilter !== 'todos' && g.status !== goalStatusFilter) {
        return false;
      }
      if (goalCategoryFilter !== 'todas' && g.category !== goalCategoryFilter) {
        return false;
      }
      if (goalSearch.trim()) {
        const q = goalSearch.toLowerCase();
        if (!g.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [goalsWithProgress, goalStatusFilter, goalCategoryFilter, goalSearch]);

  const handleBackFromGoalDetail = () => {
    const previousId = selectedGoalId;
    setSelectedGoalId(null);
    if (previousId) {
      setTimeout(() => {
        document.getElementById(`goal-card-${previousId}`)?.focus();
      }, 0);
    }
  };

  const handleResetDemoData = () => {
    resetGoals();
    resetTasks();
    setSelectedGoalId(null);
    setGoalStatusFilter('todos');
    setGoalCategoryFilter('todas');
    setGoalSearch('');
    triggerFeedback('Exemplos iniciais restaurados com sucesso.');
  };

  const handleClearAllGoals = () => {
    clearGoals();
    clearTasks();
    triggerFeedback('Lista de objetivos limpa para visualização do estado vazio.');
  };

  return (
    <>
      {/* Resumo compacto de Gamificação visível quando não está dentro do painel de detalhe de um objetivo */}
      {!selectedGoal && (
        <section
          aria-labelledby="titulo-consistencia"
          className="bg-white border border-stone-200/90 rounded-2xl p-6"
        >
          {/* 1. Nível de Consistência */}
          <h2
            id="titulo-consistencia"
            className="text-base sm:text-lg font-bold text-stone-900"
          >
            Nível de Consistência: {gamificationStats.level} — {gamificationStats.levelTitle}
          </h2>

          {/* 2. XP e Barra de Progresso */}
          <div className="mt-4 space-y-2.5">
            <p className="text-2xl font-bold font-mono-tabular text-emerald-700">
              {gamificationStats.totalXp} XP
            </p>

            {/* Barra de Progresso com leitura de porcentagem exata */}
            <div
              role="progressbar"
              aria-label={
                gamificationStats.isMaxLevel
                  ? 'Nível máximo de consistência alcançado'
                  : `Progresso para o nível ${gamificationStats.level + 1}`
              }
              aria-valuenow={gamificationStats.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={`${gamificationStats.progressPercent}%`}
              className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-emerald-600 rounded-full transition-transform duration-200 origin-left"
                style={{
                  width: '100%',
                  transform: `scaleX(${gamificationStats.progressPercent / 100})`,
                }}
              />
            </div>

            {/* Próximo passo em linguagem natural */}
            {gamificationStats.isMaxLevel ? (
              <p className="text-xs sm:text-sm font-semibold text-emerald-800">
                🏆 Nível máximo de consistência alcançado! Parabéns pela sua dedicação.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-stone-600">
                Ganhe {gamificationStats.xpToNextLevel - gamificationStats.xpInCurrentLevel} XP para alcançar o nível {gamificationStats.level + 1}
              </p>
            )}
          </div>

          {/* 3. Indicadores de Metas e Tarefas */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap gap-6 text-xs sm:text-sm text-stone-700">
            <p>
              <span className="text-stone-500">Metas ativas:</span>{' '}
              <strong className="font-semibold text-stone-900">
                {gamificationStats.activeGoalsCount}
              </strong>
            </p>
            <p>
              <span className="text-stone-500">Tarefas feitas:</span>{' '}
              <strong className="font-semibold text-stone-900">
                {gamificationStats.completedTasks}
              </strong>
            </p>
          </div>
        </section>
      )}

      {selectedGoal ? (
        <GoalDetailPanel
          goal={selectedGoal}
          linkedTasks={tasks.filter((t) => t.goalId === selectedGoal.id)}
          onBack={handleBackFromGoalDetail}
          onEditGoal={onEditGoal}
          onDeleteGoal={onDeleteGoal}
          onOpenNewTaskForGoal={onOpenNewTaskForGoal}
          onEditTask={onEditTask}
        />
      ) : (
        <section
          id="objetivos"
          aria-labelledby="heading-meus-objetivos"
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2
                id="heading-meus-objetivos"
                className="text-xl sm:text-2xl font-bold text-stone-900"
              >
                Meus Objetivos
              </h2>
              <p className="text-sm text-stone-600 mt-0.5">
                Clique ou pressione Enter sobre qualquer objetivo para abrir seu painel de tarefas e ações.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {goals.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAllGoals}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Simular lista vazia</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Restaurar exemplos</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de Filtros de Objetivos */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90">
            <div
              role="group"
              aria-label="Filtrar objetivos por status"
              className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl"
            >
              {(
                [
                  'todos',
                  'ativo',
                  'pausado',
                  'concluido',
                  'arquivado',
                ] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  aria-pressed={goalStatusFilter === st}
                  onClick={() => setGoalStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                    goalStatusFilter === st
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {st === 'todos' ? 'Todos os status' : GOAL_STATUS_LABELS[st]}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <label htmlFor="goal-category-filter" className="sr-only">
                Filtrar objetivos por categoria
              </label>
              <select
                id="goal-category-filter"
                value={goalCategoryFilter}
                onChange={(e) =>
                  setGoalCategoryFilter(e.target.value as GoalCategory | 'todas')
                }
                className="px-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                <option value="todas">Todas as categorias</option>
                {(Object.keys(GOAL_CATEGORY_LABELS) as GoalCategory[]).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {GOAL_CATEGORY_LABELS[cat]}
                    </option>
                  )
                )}
              </select>

              <div className="relative">
                <label htmlFor="goal-search-input" className="sr-only">
                  Buscar objetivo pelo título
                </label>
                <Search
                  className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="goal-search-input"
                  type="search"
                  value={goalSearch}
                  onChange={(e) => setGoalSearch(e.target.value)}
                  placeholder="Buscar objetivo..."
                  className="w-full sm:w-56 pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Lista de Cartões Limpos */}
          {goals.length === 0 ? (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-10 text-center max-w-2xl mx-auto my-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-stone-900">
                  Você ainda não possui objetivos cadastrados
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                  Grandes conquistas começam com um alvo claro. Adicione seu primeiro objetivo — como
                  estudar para uma graduação, planejar uma viagem ou organizar suas finanças — e divida-o
                  em pequenas tarefas.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onOpenNewGoalModal}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Criar meu primeiro objetivo</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-600"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  <span>Carregar objetivos de exemplo</span>
                </button>
              </div>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-8 text-center space-y-3">
              <p className="text-base font-medium text-stone-800">
                Nenhum objetivo encontrado com os filtros selecionados.
              </p>
              <p className="text-xs text-stone-500">
                Tente limpar a busca ou selecionar outra categoria ou status.
              </p>
              <button
                type="button"
                onClick={() => {
                  setGoalStatusFilter('todos');
                  setGoalCategoryFilter('todas');
                  setGoalSearch('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                Limpar filtros de objetivos
              </button>
            </div>
          ) : (
            <ul
              role="list"
              aria-label="Lista de objetivos"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filteredGoals.map((goal) => (
                <li key={goal.id} className="flex flex-col">
                  <GoalCard
                    goal={goal}
                    onSelectGoal={(id) => setSelectedGoalId(id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
};

