import api from "./api";

export interface List {
  id: string;
  boardId: string;
  title: string;
  position: number;
}

export interface CreateListRequest {
  boardId: string;
  title: string;
  position: number;
}

export const listService = {
  createList: async (data: CreateListRequest): Promise<List> => {
    const response = await api.post<List>("/lists", data);
    return response.data;
  },

  updateList: async (
    id: string,
    data: Partial<CreateListRequest>,
  ): Promise<List> => {
    const response = await api.put<List>(`/lists/${id}`, data);
    return response.data;
  },

  deleteList: async (id: string): Promise<void> => {
    await api.delete(`/lists/${id}`);
  },

  reorderLists: async (boardId: string, listIds: string[]): Promise<void> => {
    await api.put(`/boards/${boardId}/lists/reorder`, { listIds });
  },
};
