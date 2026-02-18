import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { listService, type List } from "../services/listService";

interface ListState {
  lists: List[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setLists: (lists: List[]) => void;
  fetchLists: (boardId: string) => Promise<void>;
  createList: (boardId: string, title: string) => Promise<void>;
  updateList: (listId: string, data: { title: string }) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  reorderList: (listId: string, newPosition: number) => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useListStore = create<ListState>()(
  immer((set, get) => ({
    lists: [],
    isLoading: false,
    error: null,

    setLists: (lists) => {
      set({ lists });
    },

    fetchLists: async (boardId) => {
      set({ isLoading: true, error: null });
      try {
        const lists = await listService.getLists(boardId);
        set({ lists, isLoading: false });
      } catch (error) {
        set({ error: "Failed to fetch lists", isLoading: false });
        console.error("Failed to fetch lists:", error);
      }
    },

    createList: async (boardId, title) => {
      try {
        const newList = await listService.createList(boardId, title);
        set((state) => {
          state.lists.push(newList);
        });
      } catch (error) {
        set({ error: "Failed to create list" });
        console.error("Failed to create list:", error);
      }
    },

    updateList: async (listId, data) => {
      const { lists } = get();
      const listIndex = lists.findIndex((l) => l.id === listId);
      if (listIndex === -1) return;

      const previousTitle = lists[listIndex].title;

      // Optimistic update
      set((state) => {
        if (state.lists[listIndex]) {
          state.lists[listIndex].title = data.title;
        }
      });

      try {
        await listService.updateList(listId, data);
      } catch (error) {
        // Rollback
        set((state) => {
          if (state.lists[listIndex]) {
            state.lists[listIndex].title = previousTitle;
          }
        });
        set({ error: "Failed to update list" });
        console.error("Failed to update list:", error);
      }
    },

    deleteList: async (listId) => {
      const { lists } = get();
      const previousLists = [...lists];

      // Optimistic update
      set((state) => {
        state.lists = state.lists.filter((l) => l.id !== listId);
      });

      try {
        await listService.deleteList(listId);
      } catch (error) {
        // Rollback
        set({ lists: previousLists, error: "Failed to delete list" });
        console.error("Failed to delete list:", error);
      }
    },

    reorderList: async (listId, newPosition) => {
      const { lists } = get();
      const previousLists = [...lists];
      const fromIndex = lists.findIndex((l) => l.id === listId);
      if (fromIndex === -1) return;

      // Optimistic update
      set((state) => {
        const [movedList] = state.lists.splice(fromIndex, 1);
        state.lists.splice(newPosition, 0, movedList);
      });

      try {
        await listService.reorderList(listId, newPosition);
      } catch (error) {
        // Rollback
        set({ lists: previousLists, error: "Failed to reorder list" });
        console.error("Failed to reorder list:", error);
      }
    },

    clearError: () => set({ error: null }),
  })),
);
