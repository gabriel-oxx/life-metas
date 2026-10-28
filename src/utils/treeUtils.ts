import { Subtask, TaskStatus, UnitType, UNIT_TYPE_META } from '../models/types';

/**
 * Formata um valor numérico de acordo com o tipo unitário do objetivo.
 */
export function formatUnitValue(value: number, unitType: UnitType): string {
  const meta = UNIT_TYPE_META[unitType];
  if (!meta) return `${value}`;
  if (meta.isCurrency) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: value % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }
  return `${value.toLocaleString('pt-BR')} ${meta.shortLabel}`;
}

/**
 * Formata uma data ISO ou YYYY-MM-DD para o formato brasileiro DD/MM/AAAA.
 */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Sem prazo';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

/**
 * Formata data e hora de conclusão para exibição legível em pt-BR.
 */
export function formatDateTimeBR(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return formatDateBR(isoStr);
  }
}

/**
 * Insere recursivamente uma nova subtarefa dentro de um nó pai (Subtask) em qualquer nível.
 */
export function insertSubtaskInTree(
  subtasks: Subtask[],
  parentId: string,
  newSubtask: Subtask
): Subtask[] {
  return subtasks.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        subtasks: [...node.subtasks, newSubtask],
      };
    }
    if (node.subtasks.length > 0) {
      return {
        ...node,
        subtasks: insertSubtaskInTree(node.subtasks, parentId, newSubtask),
      };
    }
    return node;
  });
}

/**
 * Atualiza recursivamente o status (e data de conclusão) de uma subtarefa em qualquer nível.
 */
export function updateSubtaskStatusInTree(
  subtasks: Subtask[],
  subtaskId: string,
  newStatus: TaskStatus
): Subtask[] {
  const nowIso = new Date().toISOString();
  return subtasks.map((node) => {
    if (node.id === subtaskId) {
      return {
        ...node,
        status: newStatus,
        completedAt: newStatus === 'concluida' ? nowIso : null,
      };
    }
    if (node.subtasks.length > 0) {
      return {
        ...node,
        subtasks: updateSubtaskStatusInTree(node.subtasks, subtaskId, newStatus),
      };
    }
    return node;
  });
}

/**
 * Edita recursivamente os dados (título, data de vencimento, status) de uma subtarefa em qualquer nível.
 */
export function editSubtaskInTree(
  subtasks: Subtask[],
  subtaskId: string,
  updates: { title: string; dueDate: string | null; status: TaskStatus }
): Subtask[] {
  const nowIso = new Date().toISOString();
  return subtasks.map((node) => {
    if (node.id === subtaskId) {
      const statusChangedToCompleted =
        updates.status === 'concluida' && node.status !== 'concluida';
      const completedAt =
        updates.status === 'concluida'
          ? statusChangedToCompleted
            ? nowIso
            : node.completedAt || nowIso
          : null;

      return {
        ...node,
        title: updates.title,
        dueDate: updates.dueDate,
        status: updates.status,
        completedAt,
      };
    }
    if (node.subtasks.length > 0) {
      return {
        ...node,
        subtasks: editSubtaskInTree(node.subtasks, subtaskId, updates),
      };
    }
    return node;
  });
}

/**
 * Remove recursivamente uma subtarefa (e suas subtarefas filhas) em qualquer nível.
 */
export function deleteSubtaskFromTree(
  subtasks: Subtask[],
  subtaskId: string
): Subtask[] {
  return subtasks
    .filter((node) => node.id !== subtaskId)
    .map((node) => ({
      ...node,
      subtasks:
        node.subtasks.length > 0
          ? deleteSubtaskFromTree(node.subtasks, subtaskId)
          : [],
    }));
}

/**
 * Conta recursivamente o total de subtarefas e quantas estão concluídas em toda a árvore de uma tarefa.
 */
export function countSubtasksRecursive(subtasks: Subtask[]): {
  total: number;
  completed: number;
} {
  let total = 0;
  let completed = 0;

  for (const sub of subtasks) {
    total += 1;
    if (sub.status === 'concluida') {
      completed += 1;
    }
    if (sub.subtasks.length > 0) {
      const childCounts = countSubtasksRecursive(sub.subtasks);
      total += childCounts.total;
      completed += childCounts.completed;
    }
  }

  return { total, completed };
}

export type TaskDateFilter = 'hoje' | 'essa_semana' | 'proximas_2_semanas';

export const TASK_DATE_FILTER_LABELS: Record<TaskDateFilter, string> = {
  hoje: 'Hoje',
  essa_semana: 'Essa semana',
  proximas_2_semanas: 'Próximas 2 semanas',
};

/**
 * Verifica se uma data YYYY-MM-DD pertence ao período selecionado em relação à data local atual.
 */
export function isDateInPeriod(
  dateStr: string | null | undefined,
  period: TaskDateFilter
): boolean {
  if (!dateStr) return false;
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return false;

  const [year, month, day] = parts;
  const taskDate = new Date(year, month - 1, day);
  taskDate.setHours(0, 0, 0, 0);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  today.setHours(0, 0, 0, 0);

  const diffMs = taskDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (period === 'hoje') {
    return diffDays === 0;
  }

  if (period === 'essa_semana') {
    return diffDays >= 0 && diffDays <= 7;
  }

  if (period === 'proximas_2_semanas') {
    return diffDays >= 0 && diffDays <= 14;
  }

  return false;
}
