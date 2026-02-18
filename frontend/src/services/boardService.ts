import api from "./api";

export interface Board {
  id: string;
  title: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  title: string;
}

export const boardService = {
  getBoards: async (): Promise<Board[]> => {
    const response = await api.get<{ data: Board[] }>("/boards");
    return response.data.data;
  },

  createBoard: async (data: CreateBoardRequest): Promise<Board> => {
    const response = await api.post<Board>("/boards", data);
    return response.data;
  },

  getBoard: async (id: string): Promise<Board> => {
    const response = await api.get<{ data: Board } | Board>(`/boards/${id}`);
    // Handle both nested and non-nested responses
    return "data" in response.data ? response.data.data : response.data;
  },

  updateBoard: async (
    id: string,
    data: Partial<CreateBoardRequest>,
  ): Promise<Board> => {
    const response = await api.put<Board>(`/boards/${id}`, data);
    return response.data;
  },

  deleteBoard: async (id: string): Promise<void> => {
    await api.delete(`/boards/${id}`);
  },
};
