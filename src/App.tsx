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
  Calendar,
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
import { calculateGamificationStats } from './utils/gamificationUtils';
import {
  deleteSubtaskFromTree,
  editSubtaskInTree,
  insertSubtaskInTree,
  updateSubtaskStatusInTree,
  TaskDateFilter,
  TASK_DATE_FILTER_LABELS,
  isDateInPeriod,
} from './utils/treeUtils';
import { GoalCard } from './components/GoalCard';
import { GoalDetailPanel } from './components/GoalDetailPanel';
import { TaskItem } from './components/TaskItem';
import { GoalFormModal } from './components/GoalFormModal';
import { TaskFormModal } from './components/TaskFormModal';
import { DeleteGoalModal } from './components/DeleteGoalModal';

const STORAGE_KEY_GOALS = 'trilha_goals_v1';
const STORAGE_KEY_TASKS = 'trilha_tasks_v1';

type ActiveView = 'objetivos' | 'tarefas' | 'metodo';
type TaskFilterMode = 'objetivo' | 'data';

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

  // Navegação de telas
  const [activeView, setActiveView] = useState<ActiveView>('objetivos');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Filtros de Objetivos
  const [goalStatusFilter, setGoalStatusFilter] = useState<
    GoalStatus | 'todos'
  >('todos');
  const [goalCategoryFilter, setGoalCategoryFilter] = useState<
    GoalCategory | 'todas'
  >('todas');
  const [goalSearch, setGoalSearch] = useState('');

  // Filtros da tela de Tarefas:
  // A) Exibição por objetivo (seleciona um objetivo para exibir as tarefas dele)
  // B) Exibição por data (hoje, essa semana, próximas 2 semanas)
  const [taskFilterMode, setTaskFilterMode] =
    useState<TaskFilterMode>('objetivo');
  const [selectedGoalForTasks, setSelectedGoalForTasks] = useState<string>(
    () => goals[0]?.id || ''
  );
  const [selectedDateFilter, setSelectedDateFilter] =
    useState<TaskDateFilter>('essa_semana');
  const [taskStatusFilter, setTaskStatusFilter] = useState<
    TaskStatus | 'todos'
  >('todos');

  // Mantém um objetivo válido selecionado no filtro por objetivo quando a lista de objetivos muda
  useEffect(() => {
    if (goals.length === 0) {
      setSelectedGoalForTasks('');
    } else if (!goals.some((g) => g.id === selectedGoalForTasks)) {
      setSelectedGoalForTasks(goals[0].id);
    }
  }, [goals, selectedGoalForTasks]);

  // Modais
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<GoalWithProgress | null>(
    null
  );

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultGoalIdForNewTask, setDefaultGoalIdForNewTask] = useState<
    string | null
  >(null);

  // Feedback de gamificação e ações anunciado para leitores de tela
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev === msg ? null : prev));
    }, 4500);
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

  const selectedGoal = useMemo(
    () => goalsWithProgress.find((g) => g.id === selectedGoalId) || null,
    [goalsWithProgress, selectedGoalId]
  );

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
  }, [selectedGoalId, isGoalModalOpen, isTaskModalOpen, goalToDelete]);

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

  // Tarefas filtradas conforme A (Exibição por objetivo) ou B (Exibição por data)
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskStatusFilter !== 'todos' && t.status !== taskStatusFilter) {
        return false;
      }

      if (taskFilterMode === 'objetivo') {
        if (!selectedGoalForTasks) return false;
        return t.goalId === selectedGoalForTasks;
      } else {
        return isDateInPeriod(t.dueDate, selectedDateFilter);
      }
    });
  }, [
    tasks,
    taskFilterMode,
    selectedGoalForTasks,
    selectedDateFilter,
    taskStatusFilter,
  ]);

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
      setActiveView('objetivos');
      setSelectedGoalId(newGoal.id);
      triggerFeedback(
        `Novo objetivo "${newGoal.title}" criado! Adicione tarefas no painel do objetivo.`
      );
    }
  };

  const handleChangeGoalStatus = (goalId: string, newStatus: GoalStatus) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, status: newStatus } : g))
    );
    triggerFeedback(
      `Status do objetivo alterado para ${GOAL_STATUS_LABELS[newStatus]}.`
    );
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

    if (selectedGoalId === goalId) {
      setSelectedGoalId(null);
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
        if (parentId === task.id) {
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtask],
          };
        }
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
    setSelectedGoalId(null);
    setGoalStatusFilter('todos');
    setGoalCategoryFilter('todas');
    setGoalSearch('');
    setSelectedGoalForTasks(INITIAL_GOALS[0]?.id || '');
    triggerFeedback('Exemplos iniciais restaurados com sucesso.');
  };

  const handleClearAllGoals = () => {
    setGoals([]);
    setSelectedGoalId(null);
    setTasks((prev) => prev.map((t) => ({ ...t, goalId: null })));
    triggerFeedback(
      'Lista de objetivos limpa para visualização do estado vazio.'
    );
  };

  const handleBackFromGoalDetail = () => {
    setGoalToDelete(null);
    const previousId = selectedGoalId;
    setSelectedGoalId(null);
    if (previousId) {
      setTimeout(() => {
        document.getElementById(`goal-card-${previousId}`)?.focus();
      }, 0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-900">
      {/* Skip Link para acessibilidade por teclado e leitores de tela */}
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-800 focus:text-white focus:rounded-xl focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Pular para o conteúdo principal
      </a>

      {/* Região ARIA Live permanente para anunciar notificações e conquistas de XP */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-5 right-5 z-40 pointer-events-none"
      >
        {feedbackBanner && (
          <div className="pointer-events-auto max-w-sm bg-stone-900 text-stone-50 px-4 py-3 rounded-xl shadow-lg border border-stone-700 text-xs sm:text-sm flex items-center gap-2.5">
            <Award
              className="w-4 h-4 text-emerald-400 shrink-0"
              aria-hidden="true"
            />
            <span>{feedbackBanner}</span>
          </div>
        )}
      </div>

      {/* Top Bar sem botão "Trilha": apenas navegação principal e ação primária contextual */}
      <header className="sticky top-0 z-30 bg-[#FAF9F5]/95 backdrop-blur-sm border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-3.5">
          {/* Navegação entre Telas */}
          <nav
            aria-label="Navegação principal"
            className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-xl"
          >
            <button
              type="button"
              aria-current={activeView === 'objetivos' ? 'page' : undefined}
              onClick={() => {
                setActiveView('objetivos');
                setSelectedGoalId(null);
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${activeView === 'objetivos'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
                }`}
            >
              Objetivos ({goals.length})
            </button>

            <button
              type="button"
              aria-current={activeView === 'tarefas' ? 'page' : undefined}
              onClick={() => {
                setActiveView('tarefas');
                setSelectedGoalId(null);
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${activeView === 'tarefas'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
                }`}
            >
              Tarefas ({tasks.length})
            </button>

            <button
              type="button"
              aria-current={activeView === 'metodo' ? 'page' : undefined}
              onClick={() => {
                setActiveView('metodo');
                setSelectedGoalId(null);
              }}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${activeView === 'metodo'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
                }`}
            >
              Método
            </button>
          </nav>

          {/* Ação primária contextual */}
          <div className="flex items-center shrink-0">
            {activeView === 'tarefas' ? (
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setDefaultGoalIdForNewTask(
                    taskFilterMode === 'objetivo' && selectedGoalForTasks
                      ? selectedGoalForTasks
                      : null
                  );
                  setIsTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Nova Tarefa</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingGoal(null);
                  setIsGoalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Novo Objetivo</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8 focus:outline-none"
      >
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
                aria-label={`Progresso para o nível ${gamificationStats.level + 1}`}
                aria-valuenow={Math.round(
                  (gamificationStats.xpInCurrentLevel / gamificationStats.xpToNextLevel) * 100
                )}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${Math.round(
                  (gamificationStats.xpInCurrentLevel / gamificationStats.xpToNextLevel) * 100
                )}%`}
                className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-emerald-600 rounded-full transition-transform duration-200 origin-left"
                  style={{
                    width: '100%',
                    transform: `scaleX(${gamificationStats.xpInCurrentLevel / gamificationStats.xpToNextLevel
                      })`,
                  }}
                />
              </div>

              {/* Próximo passo em linguagem natural */}
              <p className="text-xs sm:text-sm text-stone-600">
                Ganhe {gamificationStats.xpToNextLevel - gamificationStats.xpInCurrentLevel} XP para alcançar o nível {gamificationStats.level + 1}
              </p>
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

        {/* TELA 1: OBJETIVOS (LISTA LIMPA OU PAINEL DEDICADO DO OBJETIVO SELECIONADO) */}
        {activeView === 'objetivos' && (
          <>
            {selectedGoal ? (
              <GoalDetailPanel
                goal={selectedGoal}
                linkedTasks={tasks.filter((t) => t.goalId === selectedGoal.id)}
                onBack={handleBackFromGoalDetail}
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
                      Clique ou pressione Enter sobre qualquer objetivo para
                      abrir seu painel de tarefas e ações.
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
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${goalStatusFilter === st
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                          }`}
                      >
                        {st === 'todos'
                          ? 'Todos os status'
                          : GOAL_STATUS_LABELS[st]}
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
                        setGoalCategoryFilter(
                          e.target.value as GoalCategory | 'todas'
                        )
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
                        Grandes conquistas começam com um alvo claro. Adicione
                        seu primeiro objetivo — como estudar para uma graduação,
                        planejar uma viagem ou organizar suas finanças — e
                        divida-o em pequenas tarefas.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGoal(null);
                          setIsGoalModalOpen(true);
                        }}
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
                      Tente limpar a busca ou selecionar outra categoria ou
                      status.
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
        )}

        {/* TELA 2: TAREFAS (EXIBIÇÃO POR OBJETIVO OU EXIBIÇÃO POR DATA) */}
        {activeView === 'tarefas' && (
          <section
            id="tarefas"
            aria-labelledby="heading-tarefas"
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2
                  id="heading-tarefas"
                  className="text-xl sm:text-2xl font-bold text-stone-900"
                >
                  Minhas Tarefas
                </h2>
                <p className="text-sm text-stone-600 mt-0.5">
                  Visualize suas tarefas filtrando por objetivo específico ou
                  pelo prazo de vencimento. Clique ou pressione Enter em uma
                  tarefa para abrir seus controles.
                </p>
              </div>
            </div>

            {/* Painel de Exibição: A) Exibição por objetivo | B) Exibição por data */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/90 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Seletor entre A (Por objetivo) e B (Por data) */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-stone-600">
                    Modo de exibição:
                  </span>
                  <div
                    role="group"
                    aria-label="Escolher modo de exibição das tarefas"
                    className="inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl"
                  >
                    <button
                      type="button"
                      aria-pressed={taskFilterMode === 'objetivo'}
                      onClick={() => setTaskFilterMode('objetivo')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${taskFilterMode === 'objetivo'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                        }`}
                    >
                      <Target className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Exibição por objetivo</span>
                    </button>

                    <button
                      type="button"
                      aria-pressed={taskFilterMode === 'data'}
                      onClick={() => setTaskFilterMode('data')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${taskFilterMode === 'data'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                        }`}
                    >
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Exibição por data</span>
                    </button>
                  </div>
                </div>

                {/* Filtro de Status complementar */}
                <div
                  role="group"
                  aria-label="Filtrar tarefas por status"
                  className="flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl self-start lg:self-auto"
                >
                  {(
                    [
                      'todos',
                      'nao_iniciada',
                      'em_andamento',
                      'concluida',
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      aria-pressed={taskStatusFilter === st}
                      onClick={() => setTaskStatusFilter(st)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${taskStatusFilter === st
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                        }`}
                    >
                      {st === 'todos'
                        ? 'Todos os status'
                        : TASK_STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controle específico do modo selecionado (A ou B) */}
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center gap-3">
                {taskFilterMode === 'objetivo' ? (
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <label
                      htmlFor="select-goal-for-tasks"
                      className="text-xs font-medium text-stone-700"
                    >
                      Selecionar objetivo:
                    </label>
                    {goals.length > 0 ? (
                      <select
                        id="select-goal-for-tasks"
                        value={selectedGoalForTasks}
                        onChange={(e) =>
                          setSelectedGoalForTasks(e.target.value)
                        }
                        className="flex-1 sm:flex-initial px-3.5 py-2 text-xs sm:text-sm font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      >
                        {goals.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-stone-500">
                        Nenhum objetivo cadastrado.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <label
                      htmlFor="select-date-for-tasks"
                      className="text-xs font-medium text-stone-700"
                    >
                      Período de vencimento:
                    </label>
                    <select
                      id="select-date-for-tasks"
                      value={selectedDateFilter}
                      onChange={(e) =>
                        setSelectedDateFilter(e.target.value as TaskDateFilter)
                      }
                      className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      {(
                        [
                          'hoje',
                          'essa_semana',
                          'proximas_2_semanas',
                        ] as TaskDateFilter[]
                      ).map((period) => (
                        <option key={period} value={period}>
                          {TASK_DATE_FILTER_LABELS[period]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Tarefas Enxutas */}
            {filteredTasks.length === 0 ? (
              <div className="bg-white border border-stone-200/90 rounded-2xl p-8 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto">
                  <CheckSquare className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-stone-800">
                  Nenhuma tarefa encontrada para este filtro.
                </p>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {taskFilterMode === 'objetivo'
                    ? 'Adicione uma nova tarefa para este objetivo ou selecione outro objetivo acima.'
                    : `Não há tarefas com vencimento para ${TASK_DATE_FILTER_LABELS[selectedDateFilter]}.`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setDefaultGoalIdForNewTask(
                      taskFilterMode === 'objetivo' && selectedGoalForTasks
                        ? selectedGoalForTasks
                        : null
                    );
                    setIsTaskModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Criar Nova Tarefa</span>
                </button>
              </div>
            ) : (
              <ul
                role="list"
                aria-label="Lista de tarefas"
                className="space-y-2.5"
              >
                {filteredTasks.map((task) => {
                  const linkedGoal =
                    goals.find((g) => g.id === task.goalId) || null;
                  return (
                    <li key={task.id}>
                      <TaskItem
                        task={task}
                        linkedGoal={linkedGoal}
                        hideGoalName={taskFilterMode === 'objetivo'}
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
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* TELA 3: PILARES DO MÉTODO COMPORTAMENTAL */}
        {activeView === 'metodo' && (
          <section
            id="metodo"
            aria-labelledby="heading-metodo"
            className="space-y-6"
          >
            <div>
              <h2
                id="heading-metodo"
                className="text-xl sm:text-2xl font-bold text-stone-900"
              >
                Pilares do Método Comportamental
              </h2>
              <p className="text-sm text-stone-600 mt-0.5">
                Como a estrutura progressiva reduz a sobrecarga cognitiva e
                mantém a motivação.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h3>01. Decomposição Cognitiva</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Dividir objetivos complexos em tarefas e múltiplos níveis de
                  subtarefas elimina a paralisia por análise. Cada subtarefa
                  herda por padrão o prazo do nível superior para manter o
                  alinhamento temporal.
                </p>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <Target className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h3>02. Efeito do Gradiente de Meta</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Cada tarefa vinculada possui um valor padrão (minutos,
                  páginas, moeda) que é somado imediatamente ao objetivo quando
                  concluída, tornando o esforço diário visível e recompensador.
                </p>
              </div>

              <div className="bg-white border border-stone-200/90 rounded-2xl p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <Award className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <h3>03. Foco Progressivo Sem Ruído</h3>
                </div>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Controles de edição, exclusão, mudança de status e subtarefas
                  só aparecem quando você entra em um objetivo ou em uma tarefa,
                  evitando poluição visual e facilitando a navegação por teclado
                  e leitores de tela.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-stone-200/80 bg-white/60 py-6 px-4 sm:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <span>Gerenciamento Progressivo de Metas e Tarefas</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleResetDemoData}
              className="hover:text-stone-900 underline underline-offset-2 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
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
