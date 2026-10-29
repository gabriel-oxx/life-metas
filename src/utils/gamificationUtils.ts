import { GoalWithProgress, Task } from '../models/types';
import { countSubtasksRecursive } from './treeUtils';

export const LEVEL_TITLES = [
  'Aprendiz Esforçado',
  'Iniciante Intencional',
  'Planejador Consistente',
  'Arquiteto de Hábitos',
  'Estrategista Focado',
  'Mestre da Realização',
] as const;

export const XP_PER_SUBTASK = 15;
export const XP_PER_TASK = 50;
export const XP_PER_GOAL = 200;
export const XP_PER_LEVEL = 250;


export interface TaskMetrics {
  completedTasks: number;
  completedSubtasks: number;
  totalSubtasks: number;
}

export interface LevelInfo {
  level: number;
  levelTitle: string;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
}

export interface GamificationStats extends TaskMetrics, LevelInfo {
  totalXp: number;
  activeGoalsCount: number;
}

/**
 * 1. Extrai métricas agregadas de tarefas e subtarefas recursivas.
 */
  export function calculateTaskMetrics(tasks: Task[]): TaskMetrics {
    let completedTasks = 0;
    let totalSubtasks = 0;
    let completedSubtasks = 0;

    for (const task of tasks) {
      if (task.status === 'concluida') {
        completedTasks += 1;
      }
      const subCounts = countSubtasksRecursive(task.subtasks);
      totalSubtasks += subCounts.total;
      completedSubtasks += subCounts.completed;
    }

  return {
      completedTasks,
      completedSubtasks,
      totalSubtasks,
    };
  }

  /**
   * 2. Conta quantos objetivos foram alcançados (concluídos ou com 100% de progresso).
   */
  export function countCompletedGoals(goals: GoalWithProgress[]): number {
    return goals.filter(
      (g) => g.status === 'concluido' || g.progressPercent >= 100
    ).length;
  }

/**
 * 3. Calcula o total de pontos (XP) a partir das ações completadas.
 */
export function calculateTotalXp(
    completedSubtasks: number,
    completedTasks: number,
    completedGoals: number
  ): number {
    return (
      completedSubtasks * XP_PER_SUBTASK +
      completedTasks * XP_PER_TASK +
    completedGoals * XP_PER_GOAL
  );
  }

  /**
   * 4. Determina o nível, título comportamental e progresso do nível atual.
   * Restrição: Inicia obrigatoriamente no Nível 0 (0-249 XP).
   */
  export function getLevelInfo(totalXp: number): LevelInfo {
    const level = Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL);
    const xpInCurrentLevel = Math.max(0, totalXp) % XP_PER_LEVEL;
    const levelTitle = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)];

    return {
      level,
      levelTitle,
      xpInCurrentLevel,
      xpToNextLevel: XP_PER_LEVEL,
    };
  }

  /**
   * Função orquestradora que une as métricas de domínio para compor o estado de gamificação.
   */
  export function calculateGamificationStats(
    tasks: Task[],
    goalsWithProgress: GoalWithProgress[]
  ): GamificationStats {
    const taskMetrics = calculateTaskMetrics(tasks);
    const completedGoals = countCompletedGoals(goalsWithProgress);
    const totalXp = calculateTotalXp(
      taskMetrics.completedSubtasks,
      taskMetrics.completedTasks,
      completedGoals
    );
    const levelInfo = getLevelInfo(totalXp);
    const activeGoalsCount = goalsWithProgress.filter((g) => g.status === 'ativo').length;

    return {
      totalXp,
      activeGoalsCount,
      ...taskMetrics,
      ...levelInfo,
    };
  }
