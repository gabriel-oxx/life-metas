import { Goal, GoalWithProgress, Task } from '../models/types';
import { countSubtasksRecursive } from './treeUtils';

export interface LevelTier {
  level: number;
  title: string;
  minXp: number; // XP cumulativo necessário para atingir este nível
  requiredXpToNext: number; // XP adicional neste nível para avançar ao próximo
}

/**
 * Escala Geométrica Cumulativa de Níveis:
 * - Nível 0 (0-249 XP): Explorador Inicial (precisa de 250 XP para o Nível 1)
 * - Nível 1 (250-499 XP): Aprendiz Esforçado (precisa de +250 XP para o Nível 2)
 * - Nível 2 (500-999 XP): Iniciante Intencional (precisa de +500 XP para o Nível 3)
 * - Nível 3 (1.000-1.999 XP): Planejador Consistente (precisa de +1.000 XP para o Nível 4)
 * - Nível 4 (2.000-3.999 XP): Arquiteto de Hábitos (precisa de +2.000 XP para o Nível 5)
 * - Nível 5 (4.000-7.999 XP): Estrategista Focado (precisa de +4.000 XP para o Nível 6)
 * - Nível 6 (8.000+ XP): Mestre da Realização (Nível Máximo)
 */
export const LEVEL_TIERS: LevelTier[] = [
  { level: 0, title: 'Explorador Inicial', minXp: 0, requiredXpToNext: 250 },
  { level: 1, title: 'Aprendiz Esforçado', minXp: 250, requiredXpToNext: 250 },
  { level: 2, title: 'Iniciante Intencional', minXp: 500, requiredXpToNext: 500 },
  { level: 3, title: 'Planejador Consistente', minXp: 1000, requiredXpToNext: 1000 },
  { level: 4, title: 'Arquiteto de Hábitos', minXp: 2000, requiredXpToNext: 2000 },
  { level: 5, title: 'Estrategista Focado', minXp: 4000, requiredXpToNext: 4000 },
  { level: 6, title: 'Mestre da Realização', minXp: 8000, requiredXpToNext: 0 },
];

export const LEVEL_TITLES = LEVEL_TIERS.map((t) => t.title);

export const XP_PER_SUBTASK = 15;
export const XP_PER_TASK = 50;
export const XP_PER_GOAL = 200;

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
  progressPercent: number;
  isMaxLevel: boolean;
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
 * Baseado na escala geométrica cumulativa onde o próximo nível dobra a meta anterior.
 */
export function getLevelInfo(totalXp: number): LevelInfo {
  const safeXp = Math.max(0, totalXp);

  // Caso tenha atingido o teto de 8.000 XP (Nível Máximo: Mestre da Realização)
  const maxTier = LEVEL_TIERS[LEVEL_TIERS.length - 1];
  if (safeXp >= maxTier.minXp) {
    return {
      level: maxTier.level,
      levelTitle: maxTier.title,
      xpInCurrentLevel: maxTier.minXp,
      xpToNextLevel: maxTier.minXp,
      progressPercent: 100,
      isMaxLevel: true,
    };
  }

  // Percorre as faixas em ordem decrescente para encontrar o nível atual
  for (let i = LEVEL_TIERS.length - 2; i >= 0; i--) {
    const tier = LEVEL_TIERS[i];
    if (safeXp >= tier.minXp) {
      const xpInCurrentLevel = safeXp - tier.minXp;
      const progressPercent =
        tier.requiredXpToNext > 0
          ? Math.round((xpInCurrentLevel / tier.requiredXpToNext) * 100)
          : 100;

      return {
        level: tier.level,
        levelTitle: tier.title,
        xpInCurrentLevel,
        xpToNextLevel: tier.requiredXpToNext,
        progressPercent: Math.min(100, Math.max(0, progressPercent)),
        isMaxLevel: false,
      };
    }
  }

  // Fallback padrão para o Nível 0
  return {
    level: 0,
    levelTitle: LEVEL_TIERS[0].title,
    xpInCurrentLevel: 0,
    xpToNextLevel: LEVEL_TIERS[0].requiredXpToNext,
    progressPercent: 0,
    isMaxLevel: false,
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

/**
 * Calcula reativamente o progresso de cada objetivo a partir das tarefas a ele vinculadas.
 */
export function computeGoalsWithProgress(
  goals: Goal[],
  tasks: Task[]
): GoalWithProgress[] {
  return goals.map((goal) => {
    const linked = tasks.filter((t) => t.goalId === goal.id);
    const completed = linked.filter((t) => t.status === 'concluida');
    const currentValue = completed.reduce(
      (acc, t) => acc + (Number(t.defaultValue) || 0),
      0
    );
    const rawPercent =
      goal.targetValue > 0
        ? Math.round((currentValue / goal.targetValue) * 100)
        : 0;
    const progressPercent = Math.min(100, Math.max(0, rawPercent));

    return {
      ...goal,
      currentValue,
      progressPercent,
      linkedTasksCount: linked.length,
      completedTasksCount: completed.length,
    };
  });
}
