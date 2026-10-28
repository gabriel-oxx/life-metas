export type GoalStatus = 'ativo' | 'pausado' | 'concluido' | 'arquivado';

export type GoalCategory =
  | 'educacao'
  | 'financas'
  | 'viagem'
  | 'saude'
  | 'carreira'
  | 'rotina'
  | 'outros';

export type UnitType =
  | 'minutos'
  | 'horas'
  | 'paginas'
  | 'moeda'
  | 'capitulos'
  | 'aulas'
  | 'unidades';

export type TaskStatus = 'nao_iniciada' | 'em_andamento' | 'concluida';

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  unitType: UnitType;
  targetValue: number;
  deadline: string | null; // YYYY-MM-DD opcional
  status: GoalStatus;
  createdAt: string; // ISO 8601
}

export interface Subtask {
  id: string;
  parentId: string; // ID da tarefa ou subtarefa de nível superior
  title: string;
  dueDate: string | null; // Por padrão herda a data da tarefa ou subtarefa de nível superior
  status: TaskStatus;
  completedAt: string | null; // Preenchida quando marcada como concluída
  subtasks: Subtask[]; // Múltiplos níveis recursivos de subtarefas
}

export interface Task {
  id: string;
  goalId: string | null; // ID da meta vinculada (se houver)
  title: string;
  dueDate: string | null; // Data de vencimento
  status: TaskStatus;
  completedAt: string | null; // Quando a tarefa foi marcada como concluída
  defaultValue: number; // Exemplo: 60 minutos adicionado à meta vinculada
  subtasks: Subtask[]; // Múltiplas subtarefas aninhadas
}

export interface GoalWithProgress extends Goal {
  currentValue: number;
  progressPercent: number;
  linkedTasksCount: number;
  completedTasksCount: number;
}

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  educacao: 'Educação',
  financas: 'Finanças',
  viagem: 'Viagem',
  saude: 'Saúde e Bem-estar',
  carreira: 'Carreira',
  rotina: 'Rotina e Hábitos',
  outros: 'Outros',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
};

export const UNIT_TYPE_META: Record<
  UnitType,
  { label: string; shortLabel: string; isCurrency?: boolean; exampleTarget: number; exampleStep: number }
> = {
  minutos: {
    label: 'Minutos (tempo de foco/estudo)',
    shortLabel: 'min',
    exampleTarget: 1200,
    exampleStep: 60,
  },
  horas: {
    label: 'Horas dedicadas',
    shortLabel: 'h',
    exampleTarget: 40,
    exampleStep: 2,
  },
  paginas: {
    label: 'Páginas lidas',
    shortLabel: 'pág.',
    exampleTarget: 350,
    exampleStep: 25,
  },
  moeda: {
    label: 'Moeda (R$)',
    shortLabel: 'R$',
    isCurrency: true,
    exampleTarget: 5000,
    exampleStep: 250,
  },
  capitulos: {
    label: 'Capítulos / Módulos',
    shortLabel: 'cap.',
    exampleTarget: 12,
    exampleStep: 1,
  },
  aulas: {
    label: 'Aulas concluídas',
    shortLabel: 'aulas',
    exampleTarget: 30,
    exampleStep: 1,
  },
  unidades: {
    label: 'Unidades / Etapas',
    shortLabel: 'unid.',
    exampleTarget: 10,
    exampleStep: 1,
  },
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  nao_iniciada: 'Não iniciada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
};
