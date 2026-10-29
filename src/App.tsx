import React, { useState } from 'react';
import { Plus, Award } from 'lucide-react';
import { Goal, GoalWithProgress, Task } from './models/types';
import { GoalFormModal } from './components/GoalFormModal';
import { TaskFormModal } from './components/TaskFormModal';
import { DeleteGoalModal } from './components/DeleteGoalModal';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { TaskProvider, useTasks } from './contexts/TaskContext';
import { GoalProvider, useGoals } from './contexts/GoalContext';
import { GoalsView } from './views/GoalsView';
import { TasksView } from './views/TasksView';
import { MethodView } from './views/MethodView';

type ActiveView = 'objetivos' | 'tarefas' | 'metodo';

function AppContent() {
  const { feedbackBanner, triggerFeedback } = useNotification();
  const {
    goals,
    setSelectedGoalId,
    saveGoal,
    deleteGoal,
    resetGoals,
  } = useGoals();
  const {
    tasks,
    saveTask,
    resetTasks,
  } = useTasks();

  // Navegação entre abas principais
  const [activeView, setActiveView] = useState<ActiveView>('objetivos');

  // Estado dos modais centrais
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<GoalWithProgress | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultGoalIdForNewTask, setDefaultGoalIdForNewTask] = useState<string | null>(null);

  const handleResetDemoData = () => {
    resetGoals();
    resetTasks();
    setSelectedGoalId(null);
    triggerFeedback('Exemplos iniciais restaurados com sucesso.');
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

      {/* Top Bar: navegação de abas e ação primária contextual */}
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
                  setDefaultGoalIdForNewTask(null);
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
        {activeView === 'objetivos' && (
          <GoalsView
            onOpenNewGoalModal={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            onEditGoal={(g) => {
              setEditingGoal(g);
              setIsGoalModalOpen(true);
            }}
            onDeleteGoal={(g) => setGoalToDelete(g)}
            onOpenNewTaskForGoal={(goalId) => {
              setEditingTask(null);
              setDefaultGoalIdForNewTask(goalId);
              setIsTaskModalOpen(true);
            }}
            onEditTask={(t) => {
              setEditingTask(t);
              setDefaultGoalIdForNewTask(t.goalId);
              setIsTaskModalOpen(true);
            }}
            isGoalModalOpen={isGoalModalOpen}
            isTaskModalOpen={isTaskModalOpen}
            goalToDelete={goalToDelete}
          />
        )}

        {activeView === 'tarefas' && (
          <TasksView
            onOpenNewTaskModal={(defaultGoalId) => {
              setEditingTask(null);
              setDefaultGoalIdForNewTask(defaultGoalId ?? null);
              setIsTaskModalOpen(true);
            }}
            onEditTask={(t) => {
              setEditingTask(t);
              setDefaultGoalIdForNewTask(t.goalId);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {activeView === 'metodo' && <MethodView />}
      </main>

      {/* Rodapé com link discreto para restaurar dados de demonstração */}
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

      {/* Modais Globais */}
      <GoalFormModal
        isOpen={isGoalModalOpen}
        editingGoal={editingGoal}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={saveGoal}
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
        onSave={saveTask}
      />

      <DeleteGoalModal
        goal={goalToDelete}
        onClose={() => setGoalToDelete(null)}
        onConfirmDelete={(goalId, deleteLinkedTasks) => {
          deleteGoal(goalId, deleteLinkedTasks);
          setGoalToDelete(null);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <TaskProvider>
        <GoalProvider>
          <AppContent />
        </GoalProvider>
      </TaskProvider>
    </NotificationProvider>
  );
}
