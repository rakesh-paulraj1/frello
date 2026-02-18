import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { taskService, type Task } from "../services/taskService";
import { useListStore } from "./listStore";
import { move } from "@dnd-kit/helpers";
import type {
  WsEvent,
  TaskPayload,
  TaskMovedPayload,
  TaskAssignmentPayload,
  TaskDeletedPayload,
} from "../types/wsEvents";

interface TaskState {
  tasks: Record<string, Task[]>;
  isLoading: boolean;
  error: string | null;

  selectedTask: Task | null;
  isTaskDialogOpen: boolean;

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

  handleDragOver: (event: any) => void;

  openTaskDialog: (task: Task) => void;
  closeTaskDialog: () => void;

  applyWsEvent: (event: WsEvent) => void;

  clearError: () => void;
}

export const useTaskStore = create<TaskState>()(
  immer((set, get) => ({
    tasks: {},
    isLoading: false,
    error: null,

    selectedTask: null,
    isTaskDialogOpen: false,

    openTaskDialog: (task) =>
      set({ selectedTask: task, isTaskDialogOpen: true }),
    closeTaskDialog: () => set({ selectedTask: null, isTaskDialogOpen: false }),

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
      try {
        const tasks = await taskService.getTasks(listId);
        set((state) => {
          state.tasks[listId] = tasks;
        });
      } catch (error) {
        console.error(`Failed to fetch tasks for list ${listId}:`, error);
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
      const currentTasks = get().tasks;
      const prevFrom = currentTasks[fromListId]
        ? [...currentTasks[fromListId]]
        : [];
      const prevTo = currentTasks[toListId] ? [...currentTasks[toListId]] : [];

      let movingTask: Task | null = null;
      let locatedFrom = fromListId;
      if (currentTasks[fromListId]) {
        const idx = currentTasks[fromListId].findIndex((t) => t.id === taskId);
        if (idx !== -1) {
          movingTask = { ...currentTasks[fromListId][idx] };
        }
      }
      if (!movingTask) {
        for (const [lId, arr] of Object.entries(currentTasks)) {
          const i = arr.findIndex((t) => t.id === taskId);
          if (i !== -1) {
            locatedFrom = lId;
            movingTask = { ...arr[i] };
            break;
          }
        }
      }

      if (!movingTask) return;

      set((state) => {
        if (!state.tasks[locatedFrom]) state.tasks[locatedFrom] = [];
        if (!state.tasks[toListId]) state.tasks[toListId] = [];

        Object.keys(state.tasks).forEach((lId) => {
          state.tasks[lId] = state.tasks[lId].filter((t) => t.id !== taskId);
        });

        const dest = state.tasks[toListId];
        movingTask!.listId = toListId;
        const pos = Math.max(0, Math.min(position, dest.length));
        dest.splice(pos, 0, movingTask!);
      });

      try {
        await taskService.moveTask(taskId, toListId, position);

        set((state) => {
          Object.keys(state.tasks).forEach((lId) => {
            state.tasks[lId].forEach((t, i) => {
              t.position = i;
            });
          });
        });
      } catch (error) {
        set((state) => {
          state.tasks[fromListId] = prevFrom;
          state.tasks[toListId] = prevTo;
        });
        set({ error: "Failed to move task" });
        console.error("Failed to move task:", error);
      }
    },

    handleDragOver: (event: any) => {
      const { lists } = useListStore.getState();

      set((state) => {
        lists.forEach((l) => {
          if (!state.tasks[l.id]) state.tasks[l.id] = [];
        });

        try {
          const newTasks = move(state.tasks, event);

          Object.keys(newTasks).forEach((listId) => {
            state.tasks[listId] = newTasks[listId].map((task) => ({
              ...task,
              listId: listId,
            }));
          });
        } catch (err) {
          console.error("handleDragOver move failed:", err, event);
        }
      });
    },

    applyWsEvent: async (event) => {
      const p = event.payload as unknown;

      switch (event.type) {
        case "TASK_CREATED": {
          const task = p as TaskPayload;
          set((s) => {
            if (!s.tasks[task.listId]) s.tasks[task.listId] = [];
            if (!s.tasks[task.listId].find((t) => t.id === task.id)) {
              s.tasks[task.listId].push(task as unknown as Task);
            }
          });
          break;
        }
        case "TASK_UPDATED": {
          const task = p as TaskPayload;
          set((s) => {
            for (const list of Object.values(s.tasks)) {
              const idx = list.findIndex((t) => t.id === task.id);
              if (idx !== -1) {
                list[idx] = { ...list[idx], ...task };
                break;
              }
            }
          });
          break;
        }
        case "TASK_DELETED": {
          const { id } = p as TaskDeletedPayload;
          set((s) => {
            for (const listId of Object.keys(s.tasks)) {
              s.tasks[listId] = s.tasks[listId].filter((t) => t.id !== id);
            }
          });
          break;
        }
        case "TASK_MOVED": {
          const { id, toListId, position } = p as TaskMovedPayload;
          set((s) => {
            let movingTask: Task | null = null;
            for (const list of Object.values(s.tasks)) {
              const idx = list.findIndex((t) => t.id === id);
              if (idx !== -1) {
                movingTask = { ...list[idx] };
                break;
              }
            }
            if (!movingTask) return;

            for (const lId of Object.keys(s.tasks)) {
              s.tasks[lId] = s.tasks[lId].filter((t) => t.id !== id);
            }

            if (!s.tasks[toListId]) s.tasks[toListId] = [];
            movingTask.listId = toListId;
            const pos = Math.max(
              0,
              Math.min(position, s.tasks[toListId].length),
            );
            s.tasks[toListId].splice(pos, 0, movingTask);
          });
          break;
        }
        case "TASK_ASSIGNED":
        case "TASK_UNASSIGNED": {
          const { taskId } = p as TaskAssignmentPayload;
          try {
            const updatedTask = await taskService.getTask(taskId);
            set((s) => {
              for (const list of Object.values(s.tasks)) {
                const idx = list.findIndex((t) => t.id === taskId);
                if (idx !== -1) {
                  list[idx] = updatedTask;
                  break;
                }
              }
            });
          } catch (e) {
            // Ignore failure
          }
          break;
        }
      }
    },

    clearError: () => set({ error: null }),
  })),
);
