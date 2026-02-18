import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { boardService, type Board } from "../services/boardService";
import { useListStore } from "./listStore";
import { useTaskStore } from "./taskStore";
import type { WsEvent, BoardUpdatedPayload } from "../types/wsEvents";

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  isLoading: boolean;
  error: string | null;

  editedBoardTitle: string;
  isEditingBoardTitle: boolean;
  isSwitcherOpen: boolean;
  isCreateDialogOpen: boolean;

  fetchBoards: () => Promise<void>;
  fetchBoard: (id: string) => Promise<void>;
  createBoard: (title: string) => Promise<Board | null>;
  updateBoard: (id: string, data: { title: string }) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  setIsEditingBoardTitle: (value: boolean) => void;
  setEditedBoardTitle: (title: string) => void;
  setIsSwitcherOpen: (value: boolean) => void;
  setIsCreateDialogOpen: (value: boolean) => void;

  applyWsEvent: (event: WsEvent) => void;

  clearError: () => void;
}

export const useBoardStore = create<BoardState>()(
  immer((set, get) => ({
    boards: [],
    currentBoard: null,
    isLoading: false,
    error: null,

    // UI State initial values
    isEditingBoardTitle: false,
    editedBoardTitle: "",
    isSwitcherOpen: false,
    isCreateDialogOpen: false,

    setIsEditingBoardTitle: (value) => set({ isEditingBoardTitle: value }),
    setEditedBoardTitle: (title) => set({ editedBoardTitle: title }),
    setIsSwitcherOpen: (value) => set({ isSwitcherOpen: value }),
    setIsCreateDialogOpen: (value) => set({ isCreateDialogOpen: value }),

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

    fetchBoard: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const data = (await boardService.getBoard(id)) as unknown as Record<
          string,
          unknown
        >;
        const normalizedBoard = (data.board || data) as Board;

        set({
          currentBoard: normalizedBoard,
        });

        await useListStore.getState().fetchLists(id);
        const lists = useListStore.getState().lists;

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

    updateBoard: async (id: string, data: { title: string }) => {
      const { currentBoard } = get();
      if (!currentBoard) return;

      const previousBoard = { ...currentBoard };

      set((state) => {
        if (state.currentBoard) {
          state.currentBoard.title = data.title;
        }
        if (state.currentBoard) {
          state.currentBoard.title = data.title;
        }
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
        set({ boards: previousBoards, error: "Failed to delete board" });
        console.error("Failed to delete board:", error);
      }
    },

    applyWsEvent: (event) =>
      set((state) => {
        if (event.type === "BOARD_UPDATED") {
          const { id, title } = event.payload as unknown as BoardUpdatedPayload;
          if (state.currentBoard?.id === id) {
            state.currentBoard.title = title;
            state.editedBoardTitle = title;
          }
          const boardIdx = state.boards.findIndex((b) => b.id === id);
          if (boardIdx !== -1) state.boards[boardIdx].title = title;
        }
      }),

    clearError: () => set({ error: null }),
  })),
);
