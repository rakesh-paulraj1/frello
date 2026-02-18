import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { boardService, type Board } from "../services/boardService";
import { useListStore } from "./listStore";
import { useTaskStore } from "./taskStore";

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;

  fetchBoards: () => Promise<void>;
  fetchBoard: (id: string) => Promise<void>;
  createBoard: (title: string) => Promise<Board | null>;
  updateBoard: (id: string, data: { title: string }) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  // Utility
  clearError: () => void;
}

export const useBoardStore = create<BoardState>()(
  immer((set, get) => ({
    boards: [],
    currentBoard: null,
    isLoading: false,
    error: null,

    fetchBoards: async () => {
      set({ isLoading: true, error: null });
      try {
        const boards = await boardService.getBoards();
        set({ boards, isLoading: false });
      } catch (error) {
        set({ error: "Failed to fetch boards", isLoading: false });
        console.error("Failed to fetch boards:", error);
      }
    },

    // Fetch single board with lists and tasks (coordinated)
    fetchBoard: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        // 1. Fetch Board Metadata
        const data = (await boardService.getBoard(id)) as unknown as Record<
          string,
          unknown
        >;
        const normalizedBoard = (data.board || data) as Board;

        set({
          currentBoard: normalizedBoard,
          // Keep loading true until everything is fetched?
          // Or let components handle their own loading?
          // Let's keep it true to prevent flickering of empty board
        });

        // 2. Fetch Lists via ListStore
        await useListStore.getState().fetchLists(id);
        const lists = useListStore.getState().lists;

        // 3. Fetch Tasks via TaskStore (Parallel)
        await Promise.all(
          lists.map((list) => useTaskStore.getState().fetchTasks(list.id)),
        );

        set({ isLoading: false });
      } catch (error) {
        set({
          error: "Failed to fetch board",
          isLoading: false,
          currentBoard: null,
        });
        console.error("Failed to fetch board:", error);
      }
    },

    // Create new board
    createBoard: async (title: string) => {
      set({ error: null });
      try {
        const newBoard = await boardService.createBoard({ title });
        set((state) => {
          state.boards.push(newBoard);
        });
        return newBoard;
      } catch (error) {
        set({ error: "Failed to create board" });
        console.error("Failed to create board:", error);
        return null;
      }
    },

    // Update board
    updateBoard: async (id: string, data: { title: string }) => {
      const { currentBoard } = get();
      if (!currentBoard) return;

      // Optimistic update
      const previousBoard = { ...currentBoard };

      set((state) => {
        if (state.currentBoard) {
          state.currentBoard.title = data.title;
        }
        // Update in list
        const b = state.boards.find((b) => b.id === id);
        if (b) b.title = data.title;
      });

      try {
        const updatedData = (await boardService.updateBoard(
          id,
          data,
        )) as unknown as Record<string, unknown>;
        const updatedBoard = (updatedData.board || updatedData) as Board;

        set((state) => {
          state.currentBoard = updatedBoard;
          const index = state.boards.findIndex((b) => b.id === id);
          if (index !== -1) {
            state.boards[index] = updatedBoard;
          }
        });
      } catch (error) {
        // Rollback
        set((state) => {
          state.currentBoard = previousBoard;
          const index = state.boards.findIndex((b) => b.id === id);
          if (index !== -1) {
            state.boards[index] = previousBoard;
          }
        });
        set({ error: "Failed to update board" });
        console.error("Failed to update board:", error);
      }
    },

    // Delete board
    deleteBoard: async (id: string) => {
      const { boards } = get();
      const previousBoards = [...boards];

      set((state) => {
        state.boards = state.boards.filter((b) => b.id !== id);
        if (state.currentBoard?.id === id) {
          state.currentBoard = null;
        }
      });

      try {
        await boardService.deleteBoard(id);
      } catch (error) {
        // Rollback
        set({ boards: previousBoards, error: "Failed to delete board" });
        console.error("Failed to delete board:", error);
      }
    },

    clearError: () => set({ error: null }),
  })),
);
