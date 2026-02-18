import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { type List, listService } from "../services/listService";
import {
  type ListDeletedPayload,
  type ListPayload,
  type ListReorderedPayload,
  type WsEvent,
} from "../types/wsEvents";

interface ListState {
  lists: List[];
  isLoading: boolean;
  error: string | null;

  activeGroup: string | null;
  activeDragType: string | null;
  isAddingList: boolean;
  newListTitle: string;

  setLists: (lists: List[]) => void;
  fetchLists: (boardId: string) => Promise<void>;
  createList: (boardId: string, title: string) => Promise<void>;
  updateList: (listId: string, data: { title: string }) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  reorderList: (listId: string, newPosition: number) => Promise<void>;

  setActiveGroup: (group: string | null) => void;
  setActiveDragType: (type: string | null) => void;
  setIsAddingList: (value: boolean) => void;
  setNewListTitle: (title: string) => void;
  resetDragState: () => void;

  applyWsEvent: (event: WsEvent) => void;

  clearError: () => void;
}

export const useListStore = create<ListState>()(
  immer((set, get) => ({
    lists: [],
    isLoading: false,
    error: null,

    activeGroup: null,
    activeDragType: null,
    isAddingList: false,
    newListTitle: "",

    setActiveGroup: (group) => set({ activeGroup: group }),
    setActiveDragType: (type) => set({ activeDragType: type }),
    setIsAddingList: (value) => set({ isAddingList: value }),
    setNewListTitle: (title) => set({ newListTitle: title }),
    resetDragState: () => set({ activeGroup: null, activeDragType: null }),

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

      set((state) => {
        if (state.lists[listIndex]) {
          state.lists[listIndex].title = data.title;
        }
      });

      try {
        await listService.updateList(listId, data);
      } catch (error) {
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

      set((state) => {
        state.lists = state.lists.filter((l) => l.id !== listId);
      });

      try {
        await listService.deleteList(listId);
      } catch (error) {
        set({ lists: previousLists, error: "Failed to delete list" });
        console.error("Failed to delete list:", error);
      }
    },

    reorderList: async (listId, newPosition) => {
      const { lists } = get();
      const previousLists = [...lists];
      const fromIndex = lists.findIndex((l) => l.id === listId);
      if (fromIndex === -1) return;

      set((state) => {
        const [movedList] = state.lists.splice(fromIndex, 1);
        state.lists.splice(newPosition, 0, movedList);
      });

      try {
        await listService.reorderList(listId, newPosition);
      } catch (error) {
        set({ lists: previousLists, error: "Failed to reorder list" });
        console.error("Failed to reorder list:", error);
      }
    },

    applyWsEvent: (event) =>
      set((state) => {
        const p = event.payload as unknown;
        switch (event.type) {
          case "LIST_CREATED": {
            const list = p as ListPayload;
            if (!state.lists.find((l) => l.id === list.id)) {
              state.lists.push(list as unknown as List);
            }
            break;
          }
          case "LIST_UPDATED": {
            const list = p as ListPayload;
            const idx = state.lists.findIndex((l) => l.id === list.id);
            if (idx !== -1) state.lists[idx] = { ...state.lists[idx], ...list };
            break;
          }
          case "LIST_DELETED": {
            const { id } = p as ListDeletedPayload;
            state.lists = state.lists.filter((l) => l.id !== id);
            break;
          }
          case "LIST_REORDERED": {
            const { id, position } = p as ListReorderedPayload;
            const fromIndex = state.lists.findIndex((l) => l.id === id);
            if (fromIndex === -1) break;
            const [moved] = state.lists.splice(fromIndex, 1);
            state.lists.splice(position, 0, moved);
            break;
          }
        }
      }),

    clearError: () => set({ error: null }),
  })),
);
