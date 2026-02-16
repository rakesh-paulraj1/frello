import api from "./api";

export interface Board {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardRequest {
  title: string;
}

export const boardService = {
  getBoards: async (): Promise<Board[]> => {
    const response = await api.get<Board[]>("/boards");
    return response.data;
  },

  createBoard: async (data: CreateBoardRequest): Promise<Board> => {
    const response = await api.post<Board>("/boards", data);
    return response.data;
  },

  getBoard: async (id: string): Promise<Board> => {
    const response = await api.get<Board>(`/boards/${id}`);
    return response.data;
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
