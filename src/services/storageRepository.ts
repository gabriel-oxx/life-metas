import { Goal, Task } from '../models/types';
import { INITIAL_GOALS, INITIAL_TASKS } from '../data/initialData';

export const STORAGE_KEY_GOALS = 'trilha_goals_v1';
export const STORAGE_KEY_TASKS = 'trilha_tasks_v1';

/**
 * Repositório de persistência local para Metas e Tarefas.
 * Fornece isolamento contra erros de parsing, formato inválido ou cotas de disco excedidas.
 */
export const storageRepository = {
  loadGoals(): Goal[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return INITIAL_GOALS;
      }
      const saved = localStorage.getItem(STORAGE_KEY_GOALS);
      if (!saved) return INITIAL_GOALS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  },

  saveGoals(goals: Goal[]): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
    } catch {
      // Ignora falhas de quota ou restrições de armazenamento local
    }
  },

  loadTasks(): Task[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return INITIAL_TASKS;
      }
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      if (!saved) return INITIAL_TASKS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: Task[]): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch {
      // Ignora falhas de quota ou restrições de armazenamento local
    }
  },

  resetDemoData(): { goals: Goal[]; tasks: Task[] } {
    this.saveGoals(INITIAL_GOALS);
    this.saveTasks(INITIAL_TASKS);
    return {
      goals: INITIAL_GOALS,
      tasks: INITIAL_TASKS,
    };
  },
};
