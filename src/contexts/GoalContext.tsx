import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { Goal, GoalStatus, GoalWithProgress, GOAL_STATUS_LABELS } from '../models/types';
import { storageRepository } from '../services/storageRepository';
import { computeGoalsWithProgress } from '../utils/gamificationUtils';
import { useNotification } from './NotificationContext';
import { useTasks } from './TaskContext';
import { INITIAL_GOALS } from '../data/initialData';

interface GoalContextType {
  goals: Goal[];
  goalsWithProgress: GoalWithProgress[];
  selectedGoalId: string | null;
  selectedGoal: GoalWithProgress | null;
  setSelectedGoalId: (id: string | null) => void;
  saveGoal: (
    goalData: Omit<Goal, 'id' | 'createdAt'>,
    existingId?: string
  ) => void;
  changeGoalStatus: (goalId: string, newStatus: GoalStatus) => void;
  deleteGoal: (goalId: string, deleteLinkedTasks: boolean) => void;
  resetGoals: () => void;
  clearGoals: () => void;
}

const GoalContext = createContext<GoalContextType | null>(null);

export const GoalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>(() => storageRepository.loadGoals());
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const { tasks, deleteTasksByGoalId, unlinkTasksByGoalId } = useTasks();
  const { triggerFeedback } = useNotification();

  useEffect(() => {
    storageRepository.saveGoals(goals);
  }, [goals]);

  // Cálculo reativo de objetivos com progresso
  const goalsWithProgress = useMemo(() => {
    return computeGoalsWithProgress(goals, tasks);
  }, [goals, tasks]);

  // Objetivo atualmente selecionado
  const selectedGoal = useMemo(() => {
    return goalsWithProgress.find((g) => g.id === selectedGoalId) || null;
  }, [goalsWithProgress, selectedGoalId]);

  const saveGoal = useCallback(
    (goalData: Omit<Goal, 'id' | 'createdAt'>, existingId?: string) => {
      if (existingId) {
        setGoals((prev) =>
          prev.map((g) => (g.id === existingId ? { ...g, ...goalData } : g))
        );
        triggerFeedback(`Objetivo "${goalData.title}" atualizado com sucesso.`);
      } else {
        const newGoal: Goal = {
          ...goalData,
          id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        };
        setGoals((prev) => [newGoal, ...prev]);
        setSelectedGoalId(newGoal.id);
        triggerFeedback(
          `Novo objetivo "${newGoal.title}" criado! Adicione tarefas no painel do objetivo.`
        );
      }
    },
    [triggerFeedback]
  );

  const changeGoalStatus = useCallback(
    (goalId: string, newStatus: GoalStatus) => {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, status: newStatus } : g))
      );
      triggerFeedback(
        `Status do objetivo alterado para ${GOAL_STATUS_LABELS[newStatus]}.`
      );
    },
    [triggerFeedback]
  );

  const deleteGoal = useCallback(
    (goalId: string, deleteLinkedTasks: boolean) => {
      const target = goals.find((g) => g.id === goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));

      if (deleteLinkedTasks) {
        deleteTasksByGoalId(goalId);
      } else {
        unlinkTasksByGoalId(goalId);
      }

      if (selectedGoalId === goalId) {
        setSelectedGoalId(null);
      }

      if (target) {
        triggerFeedback(`Objetivo "${target.title}" removido.`);
      }
    },
    [goals, selectedGoalId, deleteTasksByGoalId, unlinkTasksByGoalId, triggerFeedback]
  );

  const resetGoals = useCallback(() => {
    setGoals(INITIAL_GOALS);
    setSelectedGoalId(null);
  }, []);

  const clearGoals = useCallback(() => {
    setGoals([]);
    setSelectedGoalId(null);
  }, []);

  return (
    <GoalContext.Provider
      value={{
        goals,
        goalsWithProgress,
        selectedGoalId,
        selectedGoal,
        setSelectedGoalId,
        saveGoal,
        changeGoalStatus,
        deleteGoal,
        resetGoals,
        clearGoals,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

export function useGoals(): GoalContextType {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoals deve ser utilizado dentro de um GoalProvider');
  }
  return context;
}

