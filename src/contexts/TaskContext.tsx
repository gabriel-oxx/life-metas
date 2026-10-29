import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Subtask, Task, TaskStatus } from '../models/types';
import { storageRepository } from '../services/storageRepository';
import {
  deleteSubtaskFromTree,
  editSubtaskInTree,
  insertSubtaskInTree,
  updateSubtaskStatusInTree,
} from '../utils/treeUtils';
import { useNotification } from './NotificationContext';
import { INITIAL_TASKS } from '../data/initialData';

interface TaskContextType {
  tasks: Task[];
  saveTask: (
    taskData: {
      title: string;
      goalId: string | null;
      dueDate: string | null;
      status: TaskStatus;
      defaultValue: number;
    },
    existingTaskId?: string
  ) => void;
  updateTaskStatus: (
    taskId: string,
    newStatus: TaskStatus,
    linkedGoalTitle?: string
  ) => void;
  deleteTask: (taskId: string) => void;
  addSubtask: (
    taskId: string,
    parentId: string,
    title: string,
    dueDate: string | null
  ) => void;
  updateSubtaskStatus: (
    taskId: string,
    subtaskId: string,
    newStatus: TaskStatus
  ) => void;
  editSubtask: (
    taskId: string,
    subtaskId: string,
    updates: { title: string; dueDate: string | null; status: TaskStatus }
  ) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  deleteTasksByGoalId: (goalId: string) => void;
  unlinkTasksByGoalId: (goalId: string) => void;
  resetTasks: () => void;
  clearTasks: () => void;
}

const TaskContext = createContext<TaskContextType | null>(null);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(() => storageRepository.loadTasks());
  const { triggerFeedback } = useNotification();

  useEffect(() => {
    storageRepository.saveTasks(tasks);
  }, [tasks]);

  const saveTask = useCallback(
    (
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
    },
    [triggerFeedback]
  );

  const updateTaskStatus = useCallback(
    (taskId: string, newStatus: TaskStatus, linkedGoalTitle?: string) => {
      const nowIso = new Date().toISOString();
      let targetTask: Task | undefined;

      setTasks((prev) => {
        targetTask = prev.find((t) => t.id === taskId);
        return prev.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'concluida' ? nowIso : null,
          };
        });
      });

      if (newStatus === 'concluida') {
        if (linkedGoalTitle && targetTask && targetTask.defaultValue > 0) {
          triggerFeedback(
            `+50 XP! Tarefa concluída e progresso somado ao objetivo "${linkedGoalTitle}".`
          );
        } else if (targetTask) {
          triggerFeedback(`+50 XP! Tarefa "${targetTask.title}" concluída.`);
        }
      }
    },
    [triggerFeedback]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      triggerFeedback('Tarefa removida.');
    },
    [triggerFeedback]
  );

  const addSubtask = useCallback(
    (
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
    },
    [triggerFeedback]
  );

  const updateSubtaskStatus = useCallback(
    (taskId: string, subtaskId: string, newStatus: TaskStatus) => {
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
    },
    [triggerFeedback]
  );

  const editSubtask = useCallback(
    (
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
    },
    [triggerFeedback]
  );

  const deleteSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
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
    },
    [triggerFeedback]
  );

  const deleteTasksByGoalId = useCallback((goalId: string) => {
    setTasks((prev) => prev.filter((t) => t.goalId !== goalId));
  }, []);

  const unlinkTasksByGoalId = useCallback((goalId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.goalId === goalId ? { ...t, goalId: null } : t))
    );
  }, []);

  const resetTasks = useCallback(() => {
    setTasks(INITIAL_TASKS);
  }, []);

  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        saveTask,
        updateTaskStatus,
        deleteTask,
        addSubtask,
        updateSubtaskStatus,
        editSubtask,
        deleteSubtask,
        deleteTasksByGoalId,
        unlinkTasksByGoalId,
        resetTasks,
        clearTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export function useTasks(): TaskContextType {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks deve ser utilizado dentro de um TaskProvider');
  }
  return context;
}

