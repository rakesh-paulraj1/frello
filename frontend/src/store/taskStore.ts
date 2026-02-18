import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { taskService, type Task } from "../services/taskService";
import { useListStore } from "./listStore";
import { move } from "@dnd-kit/helpers";

interface TaskState {
  tasks: Record<string, Task[]>; // Map listId -> tasks
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (listId: string, tasks: Task[]) => void;
  setAllTasks: (tasksMap: Record<string, Task[]>) => void;

  fetchTasks: (listId: string) => Promise<void>;
  createTask: (
    listId: string,
    title: string,
    description?: string,
  ) => Promise<void>;
  updateTask: (
    taskId: string,
    data: { title: string; description?: string },
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (
    taskId: string,
    fromListId: string,
    toListId: string,
    position: number,
  ) => Promise<void>;

  // Drag operations
  handleDragOver: (event: any) => void;

  // Utility
  clearError: () => void;
}

export const useTaskStore = create<TaskState>()(
  immer((set, get) => ({
    tasks: {},
    isLoading: false,
    error: null,

    setTasks: (listId, tasks) => {
      set((state) => {
        state.tasks[listId] = tasks;
      });
    },

    setAllTasks: (tasksMap) => {
      set((state) => {
        state.tasks = tasksMap;
      });
    },

    fetchTasks: async (listId) => {
      // Don't set global isLoading for single list fetch as it might flicker too much
      // or we can add a loading state per list if needed
      try {
        const tasks = await taskService.getTasks(listId);
        set((state) => {
          state.tasks[listId] = tasks;
        });
      } catch (error) {
        console.error(`Failed to fetch tasks for list ${listId}:`, error);
        // Don't set global error for background fetches
      }
    },

    createTask: async (listId, title, description) => {
      try {
        const newTask = await taskService.createTask(
          listId,
          title,
          description,
        );
        set((state) => {
          if (!state.tasks[listId]) {
            state.tasks[listId] = [];
          }
          state.tasks[listId].push(newTask);
        });
      } catch (error) {
        set({ error: "Failed to create task" });
        console.error("Failed to create task:", error);
      }
    },

    updateTask: async (taskId, data) => {
      // Find task
      let listId = "";
      let taskIndex = -1;
      let previousTask: Task | null = null;

      const { tasks } = get();

      // Search in all lists
      for (const [lId, taskList] of Object.entries(tasks)) {
        const idx = taskList.findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          listId = lId;
          taskIndex = idx;
          previousTask = { ...taskList[idx] };
          break;
        }
      }

      if (!previousTask || !listId) return;

      // Optimistic update
      set((state) => {
        const task = state.tasks[listId][taskIndex];
        if (task) {
          task.title = data.title;
          if (data.description !== undefined) {
            task.description = data.description;
          }
        }
      });

      try {
        await taskService.updateTask(taskId, data);
      } catch (error) {
        // Rollback
        set((state) => {
          if (state.tasks[listId]) {
            state.tasks[listId][taskIndex] = previousTask!;
          }
        });
        set({ error: "Failed to update task" });
        console.error("Failed to update task:", error);
      }
    },

    deleteTask: async (taskId) => {
      // Find task
      let listId = "";
      let taskIndex = -1;
      let previousTask: Task | null = null;

      const { tasks } = get();

      for (const [lId, taskList] of Object.entries(tasks)) {
        const idx = taskList.findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          listId = lId;
          taskIndex = idx;
          previousTask = { ...taskList[idx] };
          break;
        }
      }

      if (!previousTask || !listId) return;

      // Optimistic update
      set((state) => {
        if (state.tasks[listId]) {
          state.tasks[listId] = state.tasks[listId].filter(
            (t) => t.id !== taskId,
          );
        }
      });

      try {
        await taskService.deleteTask(taskId);
      } catch (error) {
        // Rollback
        set((state) => {
          if (state.tasks[listId]) {
            state.tasks[listId].splice(taskIndex, 0, previousTask!);
          }
        });
        set({ error: "Failed to delete task" });
        console.error("Failed to delete task:", error);
      }
    },

    moveTask: async (taskId, fromListId, toListId, position) => {
      // Optimistic update: move task locally first
      const prevFrom = get().tasks[fromListId] ? [...get().tasks[fromListId]] : [];
      const prevTo = get().tasks[toListId] ? [...get().tasks[toListId]] : [];

      set((state) => {
        // Ensure both lists exist
        if (!state.tasks[fromListId]) state.tasks[fromListId] = [];
        if (!state.tasks[toListId]) state.tasks[toListId] = [];

        // Find and remove the task from the source list
        let movingTask: Task | undefined;
        const idx = state.tasks[fromListId].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          movingTask = state.tasks[fromListId].splice(idx, 1)[0];
        } else {
          // Fallback: search all lists
          for (const [lId, arr] of Object.entries(state.tasks)) {
            const i = arr.findIndex((t) => t.id === taskId);
            if (i !== -1) {
              movingTask = state.tasks[lId].splice(i, 1)[0];
              break;
            }
          }
        }

        if (!movingTask) return;

        // Update task's listId and insert into destination
        movingTask.listId = toListId;
        const dest = state.tasks[toListId];
        const pos = Math.max(0, Math.min(position, dest.length));
        dest.splice(pos, 0, movingTask);
      });

      try {
        await taskService.moveTask(taskId, toListId, position);

        // Persisted on server — update local positions to match new order
        set((state) => {
          const fromArr = state.tasks[fromListId] || [];
          const toArr = state.tasks[toListId] || [];

          fromArr.forEach((t, i) => {
            t.position = i;
          });
          toArr.forEach((t, i) => {
            t.position = i;
          });
        });
      } catch (error) {
        // Revert optimistic update
        set((state) => {
          state.tasks[fromListId] = prevFrom;
          state.tasks[toListId] = prevTo;
        });
        set({ error: "Failed to move task" });
        console.error("Failed to move task:", error);
      }
    },

    handleDragOver: (event: any) => {
      set((state) => {
        // Ensure all lists exist in the tasks map so empty lists accept drops
        const { lists } = useListStore.getState();
        lists.forEach((l) => {
          if (!state.tasks[l.id]) state.tasks[l.id] = [];
        });

        try {
          // move helper expects { [key]: array } which matches our state.tasks structure exactly
          const newTasks = move(state.tasks, event);

          // Update state with new structure and normalize listId on each task
          Object.keys(newTasks).forEach((listId) => {
            state.tasks[listId] = newTasks[listId].map((task) => ({
              ...task,
              listId: listId,
            }));
          });
        } catch (err) {
          // If move fails, log and skip optimistic update
          console.error('handleDragOver move failed:', err, event);
        }
      });
    },

    clearError: () => set({ error: null }),
  })),
);
