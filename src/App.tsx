import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Award,
  Target,
  CheckSquare,
  Compass,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  Goal,
  GoalCategory,
  GoalStatus,
  GoalWithProgress,
  Subtask,
  Task,
  TaskStatus,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from './models/types';
import { INITIAL_GOALS, INITIAL_TASKS } from './data/initialData';
import {
  countSubtasksRecursive,
  deleteSubtaskFromTree,
  editSubtaskInTree,
  insertSubtaskInTree,
  updateSubtaskStatusInTree,
} from './utils/treeUtils';
import { GoalCard } from './components/GoalCard';
import { TaskItem } from './components/TaskItem';
import { GoalFormModal } from './components/GoalFormModal';
import { TaskFormModal } from './components/TaskFormModal';
import { DeleteGoalModal } from './components/DeleteGoalModal';

const STORAGE_KEY_GOALS = 'trilha_goals_v1';
const STORAGE_KEY_TASKS = 'trilha_tasks_v1';

export default function App() {
  // Estado principal com persistência local
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GOALS);
      return saved ? JSON.parse(saved) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(goals));
    } catch {
      // Ignora erro de quota
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    } catch {
      // Ignora erro de quota
    }
  }, [tasks]);

  // Filtros de Objetivos
  const [goalStatusFilter, setGoalStatusFilter] = useState<GoalStatus | 'todos'>('todos');
  const [goalCategoryFilter, setGoalCategoryFilter] = useState<GoalCategory | 'todas'>('todas');
  const [goalSearch, setGoalSearch] = useState('');

  // Filtros de Tarefas
  const [taskGoalFilter, setTaskGoalFilter] = useState<string>('todas'); // 'todas' | 'avulsas' | goal.id
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | 'todos'>('todos');

  // Modais
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<GoalWithProgress | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultGoalIdForNewTask, setDefaultGoalIdForNewTask] = useState<string | null>(null);

  // Feedback sutil de gamificação
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Cálculo reativo de progresso dos objetivos com base nas tarefas vinculadas concluídas
  const goalsWithProgress: GoalWithProgress[] = useMemo(() => {
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
  }, [goals, tasks]);

  // Pontuação Gamificada (XP Comportamental)
  const gamificationStats = useMemo(() => {
    let completedTasks = 0;
    let totalSubtasks = 0;
    let completedSubtasks = 0;

    for (const task of tasks) {
      if (task.status === 'concluida') completedTasks += 1;
      const subCounts = countSubtasksRecursive(task.subtasks);
      totalSubtasks += subCounts.total;
      completedSubtasks += subCounts.completed;
    }

    const completedGoals = goalsWithProgress.filter(
      (g) => g.status === 'concluido' || g.progressPercent >= 100
    ).length;

    // Cada subtarefa concluída = 15 XP | Cada tarefa concluída = 50 XP | Meta concluída = 200 XP
    const totalXp =
      completedSubtasks * 15 + completedTasks * 50 + completedGoals * 200;
    const level = Math.floor(totalXp / 250) + 1;
    const xpInCurrentLevel = totalXp % 250;

    const levelTitles = [
      'Iniciante Intencional',
      'Planejador Consistente',
      'Arquiteto de Hábitos',
      'Estrategista Focado',
      'Mestre da Realização',
    ];
    const levelTitle =
      levelTitles[Math.min(level - 1, levelTitles.length - 1)];

    return {
      totalXp,
      level,
      levelTitle,
      xpInCurrentLevel,
      xpToNextLevel: 250,
      completedTasks,
      completedSubtasks,
      totalSubtasks,
      activeGoalsCount: goals.filter((g) => g.status === 'ativo').length,
    };
  }, [tasks, goals, goalsWithProgress]);

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

  // Tarefas filtradas para o painel de tarefas
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskGoalFilter === 'avulsas' && t.goalId !== null) return false;
      if (
        taskGoalFilter !== 'todas' &&
        taskGoalFilter !== 'avulsas' &&
        t.goalId !== taskGoalFilter
      ) {
        return false;
      }
      if (taskStatusFilter !== 'todos' && t.status !== taskStatusFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, taskGoalFilter, taskStatusFilter]);

  // --- HANDLERS DE OBJETIVOS (CRUD) ---

  const handleSaveGoal = (
    goalData: Omit<Goal, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
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
      triggerFeedback(
        `Novo objetivo "${newGoal.title}" adicionado! Vincule tarefas para avançar.`
      );
    }
  };

  const handleChangeGoalStatus = (goalId: string, newStatus: GoalStatus) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, status: newStatus } : g))
    );
    triggerFeedback(`Status do objetivo alterado para ${GOAL_STATUS_LABELS[newStatus]}.`);
  };

  const handleConfirmDeleteGoal = (
    goalId: string,
    deleteLinkedTasks: boolean
  ) => {
    const target = goals.find((g) => g.id === goalId);
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    if (deleteLinkedTasks) {
      setTasks((prev) => prev.filter((t) => t.goalId !== goalId));
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.goalId === goalId ? { ...t, goalId: null } : t))
      );
    }

    if (taskGoalFilter === goalId) {
      setTaskGoalFilter('todas');
    }

    if (target) {
      triggerFeedback(`Objetivo "${target.title}" removido.`);
    }
  };

  // --- HANDLERS DE TAREFAS (CRUD + Gamificação) ---

  const handleSaveTask = (
    taskData: {
      title: string;
      goalId: string | null;
      dueDate: string | null;
      status: TaskStatus;
      defaultValue: number;
    },
    existingTaskId?: string
  ) => {
    const nowIso = new Date().toISOString();

    if (existingTaskId) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== existingTaskId) return t;
          const becameCompleted =
            taskData.status === 'concluida' && t.status !== 'concluida';
          const completedAt =
            taskData.status === 'concluida'
              ? becameCompleted
                ? nowIso
                : t.completedAt || nowIso
              : null;

          return {
            ...t,
            title: taskData.title,
            goalId: taskData.goalId,
            dueDate: taskData.dueDate,
            status: taskData.status,
            defaultValue: taskData.defaultValue,
            completedAt,
          };
        })
      );
      triggerFeedback(`Tarefa "${taskData.title}" atualizada.`);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        goalId: taskData.goalId,
        title: taskData.title,
        dueDate: taskData.dueDate,
        status: taskData.status,
        completedAt: taskData.status === 'concluida' ? nowIso : null,
        defaultValue: taskData.defaultValue,
        subtasks: [],
      };
      setTasks((prev) => [newTask, ...prev]);
      triggerFeedback(`Tarefa "${newTask.title}" criada.`);
    }
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    const nowIso = new Date().toISOString();
    const targetTask = tasks.find((t) => t.id === taskId);

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: newStatus,
          completedAt: newStatus === 'concluida' ? nowIso : null,
        };
      })
    );

    if (targetTask && newStatus === 'concluida') {
      const linkedGoal = goals.find((g) => g.id === targetTask.goalId);
      if (linkedGoal && targetTask.defaultValue > 0) {
        triggerFeedback(
          `+50 XP! Tarefa concluída e progresso somado ao objetivo "${linkedGoal.title}".`
        );
      } else {
        triggerFeedback(`+50 XP! Tarefa "${targetTask.title}" concluída.`);
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    triggerFeedback('Tarefa removida.');
  };

  // --- HANDLERS DE SUBTAREFAS MULTINÍVEL ---

  const handleAddSubtask = (
    taskId: string,
    parentId: string,
    title: string,
    dueDate: string | null
  ) => {
    const newSubtask: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      parentId,
      title,
      dueDate,
      status: 'nao_iniciada',
      completedAt: null,
      subtasks: [],
    };

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        // Se parentId é o próprio ID da tarefa raiz, adiciona no nível 0
        if (parentId === task.id) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtask],
          };
        }
        // Caso contrário, insere recursivamente na subtarefa pai
        return {
          ...task,
          subtasks: insertSubtaskInTree(task.subtasks, parentId, newSubtask),
        };
      })
    );
    triggerFeedback(`Subtarefa "${title}" adicionada.`);
  };

  const handleUpdateSubtaskStatus = (
    taskId: string,
    subtaskId: string,
    newStatus: TaskStatus
  ) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subtasks: updateSubtaskStatusInTree(
            task.subtasks,
            subtaskId,
            newStatus
          ),
        };
      })
    );
    if (newStatus === 'concluida') {
      triggerFeedback('+15 XP! Subtarefa marcada como concluída.');
    }
  };

  const handleEditSubtask = (
    taskId: string,
    subtaskId: string,
    updates: { title: string; dueDate: string | null; status: TaskStatus }
  ) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subtasks: editSubtaskInTree(task.subtasks, subtaskId, updates),
        };
      })
    );
    triggerFeedback('Subtarefa atualizada.');
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          subtasks: deleteSubtaskFromTree(task.subtasks, subtaskId),
        };
      })
    );
    triggerFeedback('Subtarefa excluída.');
  };

  const handleResetDemoData = () => {
    setGoals(INITIAL_GOALS);
    setTasks(INITIAL_TASKS);
    setGoalStatusFilter('todos');
    setGoalCategoryFilter('todas');
    setGoalSearch('');
    triggerFeedback('Exemplos iniciais restaurados com sucesso.');
  };

  const handleClearAllGoals = () => {
    setGoals([]);
    setTasks((prev) => prev.map((t) => ({ ...t, goalId: null })));
    triggerFeedback('Lista de objetivos limpa para visualização do estado vazio.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-900">
      {/* Top Bar Contract: 3 zonas separadas por gap-8 */}
      <header className="sticky top-0 z-30 bg-[#FAF9F5]/95 backdrop-blur-sm border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-8 py-4">
          {/* Zona 1: Brand Wordmark em linha única */}
          <a
            href="#topo"
            className="text-lg font-bold tracking-tight text-stone-900 font-display whitespace-nowrap shrink-0"
          >
            Trilha
          </a>

          {/* Zona 2: Links de navegação concisos em linha única */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <a
              href="#objetivos"
              className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Objetivos
            </a>
            <a
              href="#tarefas"
              className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Tarefas e Subtarefas
            </a>
            <a
              href="#metodo"
              className="hover:text-stone-950 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Método Comportamental
            </a>
          </nav>

          {/* Zona 3: 1 Ação primária */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Objetivo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notificação Flutuante de Recompensa / Feedback */}
      {feedbackBanner && (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm bg-stone-900 text-stone-50 px-4 py-3 rounded-xl shadow-lg border border-stone-700 text-xs sm:text-sm flex items-center gap-2.5">
          <Award className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main id="topo" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-12">
        {/* Painel de Boas-vindas e Gamificação Comportamental */}
        <section className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-2.5">
              <p className="text-xs font-medium text-emerald-800">
                Psicologia Comportamental Aplicada · Gestão Progressiva
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                Avance em objetivos complexos através de micro-etapas visíveis.
              </h1>
              <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">
                Decomponha metas de longo prazo — desde manter uma rotina semanal até
                concluir uma graduação — em tarefas quantificáveis e múltiplos níveis de
                subtarefas. Cada ação concluída alimenta imediatamente o progresso da sua
                meta.
              </p>
            </div>

            <div className="lg:col-span-5 bg-stone-50/90 border border-stone-200/80 rounded-xl p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-stone-500 block">
                    Nível de Consistência {gamificationStats.level}
                  </span>
                  <span className="text-base font-semibold text-stone-900">
                    {gamificationStats.levelTitle}
                  </span>
                </div>
                <div className="text-right font-mono-tabular">
                  <span className="text-lg font-bold text-emerald-700">
                    {gamificationStats.totalXp} XP
                  </span>
                  <span className="text-xs text-stone-500 block">
                    {gamificationStats.xpInCurrentLevel}/{gamificationStats.xpToNextLevel} XP p/ próximo nível
                  </span>
                </div>
              </div>

              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-transform duration-200 origin-left"
                  style={{
                    width: '100%',
                    transform: `scaleX(${
                      gamificationStats.xpInCurrentLevel /
                      gamificationStats.xpToNextLevel
                    })`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200/70 text-xs">
                <div>
                  <span className="text-stone-500 block">Metas ativas</span>
                  <span className="font-mono-tabular font-semibold text-stone-900 text-sm">
                    {gamificationStats.activeGoalsCount}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Tarefas concluídas</span>
                  <span className="font-mono-tabular font-semibold text-stone-900 text-sm">
                    {gamificationStats.completedTasks}/{tasks.length}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Subtarefas feitas</span>
                  <span className="font-mono-tabular font-semibold text-stone-900 text-sm">
                    {gamificationStats.completedSubtasks}/{gamificationStats.totalSubtasks}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 1: OBJETIVOS (METAS) */}
        <section id="objetivos" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Meus Objetivos
              </h2>
              <p className="text-sm text-stone-600 mt-0.5">
                Acompanhe seus objetivos por unidade de medida, prazo e progresso acumulado.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {goals.length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearAllGoals}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors whitespace-nowrap shrink-0"
                  title="Remove todos os objetivos para testar a mensagem de lista vazia"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Simular lista vazia</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-200/70 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar exemplos</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setEditingGoal(null);
                  setIsGoalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Objetivo</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros de Objetivos */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90">
            {/* Filtro segmentado por Status */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl">
              {(
                ['todos', 'ativo', 'pausado', 'concluido', 'arquivado'] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setGoalStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
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
              {/* Filtro por Categoria */}
              <select
                aria-label="Filtrar por categoria"
                value={goalCategoryFilter}
                onChange={(e) =>
                  setGoalCategoryFilter(e.target.value as GoalCategory | 'todas')
                }
                className="px-3 py-2 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-700 focus:outline-none focus:border-emerald-600"
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

              {/* Busca por título */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={goalSearch}
                  onChange={(e) => setGoalSearch(e.target.value)}
                  placeholder="Buscar objetivo..."
                  className="w-full sm:w-56 pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Lista de Cartões ou Mensagens quando não houver objetivos */}
          {goals.length === 0 ? (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-10 text-center max-w-2xl mx-auto my-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-stone-900">
                  Você ainda não possui objetivos cadastrados
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
                  Grandes conquistas começam com um alvo claro. Adicione seu primeiro
                  objetivo — como estudar para uma graduação, planejar uma viagem ou
                  organizar suas finanças — e divida-o em pequenas tarefas.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(null);
                    setIsGoalModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar meu primeiro objetivo</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
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
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Limpar filtros de objetivos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  linkedTasks={tasks.filter((t) => t.goalId === goal.id)}
                  onEditGoal={(g) => {
                    setEditingGoal(g);
                    setIsGoalModalOpen(true);
                  }}
                  onDeleteGoal={(g) => setGoalToDelete(g)}
                  onChangeGoalStatus={handleChangeGoalStatus}
                  onOpenNewTaskForGoal={(goalId) => {
                    setEditingTask(null);
                    setDefaultGoalIdForNewTask(goalId);
                    setIsTaskModalOpen(true);
                  }}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onEditTask={(t) => {
                    setEditingTask(t);
                    setDefaultGoalIdForNewTask(null);
                    setIsTaskModalOpen(true);
                  }}
                  onDeleteTask={handleDeleteTask}
                  onAddSubtask={handleAddSubtask}
                  onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                  onEditSubtask={handleEditSubtask}
                  onDeleteSubtask={handleDeleteSubtask}
                />
              ))}
            </div>
          )}
        </section>

        {/* SEÇÃO 2: CENTRAL DE TAREFAS E SUBTAREFAS MULTINÍVEL */}
        <section id="tarefas" className="space-y-6 pt-4 border-t border-stone-200/80">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                Tarefas e Subtarefas Aninhadas
              </h2>
              <p className="text-sm text-stone-600 mt-0.5">
                Gerencie todas as tarefas vinculadas a metas ou tarefas avulsas do dia a dia,
                com múltiplos níveis de subtarefas.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setDefaultGoalIdForNewTask(
                  taskGoalFilter !== 'todas' && taskGoalFilter !== 'avulsas'
                    ? taskGoalFilter
                    : null
                );
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-stone-900 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Nova Tarefa</span>
            </button>
          </div>

          {/* Filtros de Tarefas */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/90">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="filter-task-goal" className="text-xs font-medium text-stone-600">
                Vínculo:
              </label>
              <select
                id="filter-task-goal"
                value={taskGoalFilter}
                onChange={(e) => setTaskGoalFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-800 focus:outline-none focus:border-emerald-600"
              >
                <option value="todas">Todas as tarefas ({tasks.length})</option>
                <option value="avulsas">
                  Apenas tarefas avulsas (sem meta vinculada)
                </option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    Meta: {g.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl">
              {(['todos', 'nao_iniciada', 'em_andamento', 'concluida'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTaskStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      taskStatusFilter === st
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {st === 'todos' ? 'Todos os status' : TASK_STATUS_LABELS[st]}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Lista de Tarefas */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto">
                <CheckSquare className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-stone-800">
                Nenhuma tarefa para exibir nesta visualização.
              </p>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Adicione uma nova tarefa vinculada a um objetivo ou crie uma tarefa avulsa
                para organizar sua rotina.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setDefaultGoalIdForNewTask(null);
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Tarefa</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const linkedGoal =
                  goals.find((g) => g.id === task.goalId) || null;
                return (
                  <TaskItem
                    key={task.id}
                    task={task}
                    linkedGoal={linkedGoal}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    onEditTask={(t) => {
                      setEditingTask(t);
                      setDefaultGoalIdForNewTask(null);
                      setIsTaskModalOpen(true);
                    }}
                    onDeleteTask={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    onUpdateSubtaskStatus={handleUpdateSubtaskStatus}
                    onEditSubtask={handleEditSubtask}
                    onDeleteSubtask={handleDeleteSubtask}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* SEÇÃO 3: PILARES DO MÉTODO COMPORTAMENTAL */}
        <section
          id="metodo"
          className="pt-4 border-t border-stone-200/80 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <Compass className="w-4 h-4 shrink-0" />
              <span>01. Decomposição Cognitiva</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Dividir objetivos complexos em tarefas e múltiplos níveis de subtarefas
              elimina a paralisia por análise. Cada subtarefa herda por padrão o prazo do
              nível superior para manter o alinhamento temporal.
            </p>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <Target className="w-4 h-4 shrink-0" />
              <span>02. Efeito do Gradiente de Meta</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cada tarefa vinculada possui um valor padrão (minutos, páginas, moeda) que é
              somado imediatamente ao objetivo quando concluída, tornando o esforço diário
              visível e recompensador.
            </p>
          </div>

          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <Award className="w-4 h-4 shrink-0" />
              <span>03. Flexibilidade de Rotina</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Nem toda tarefa precisa pertencer a um grande projeto. Você pode gerenciar
              tarefas avulsas do cotidiano no mesmo fluxo das tarefas vinculadas aos seus
              objetivos principais.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200/80 bg-white/60 py-6 px-4 sm:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span>Trilha — Gerenciamento Progressivo de Metas e Tarefas</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetDemoData}
              className="hover:text-stone-900 underline underline-offset-2 transition-colors"
            >
              Restaurar dados de demonstração
            </button>
          </div>
        </div>
      </footer>

      {/* Modais */}
      <GoalFormModal
        isOpen={isGoalModalOpen}
        editingGoal={editingGoal}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        editingTask={editingTask}
        defaultGoalId={defaultGoalIdForNewTask}
        goals={goals}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setDefaultGoalIdForNewTask(null);
        }}
        onSave={handleSaveTask}
      />

      <DeleteGoalModal
        goal={goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirmDelete={handleConfirmDeleteGoal}
      />
    </div>
  );
}
