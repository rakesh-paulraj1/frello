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
 
  getLists: async (boardId: string): Promise<List[]> => {
    const response = await api.get<{ data: List[] }>(
      `/boards/${boardId}/lists`,
    );
    return response.data.data;
  },

  // Create a new list
  createList: async (boardId: string, title: string): Promise<List> => {
    const response = await api.post<List>(`/boards/${boardId}/lists`, {
      title,
    });
    return response.data;
  },

  // Update list title
  updateList: async (
    id: string,
    data: Partial<{ title: string }>,
  ): Promise<List> => {
    const response = await api.put<List>(`/lists/${id}`, data);
    return response.data;
  },

  // Delete a list
  deleteList: async (id: string): Promise<void> => {
    await api.delete(`/lists/${id}`);
  },

  // Reorder a single list
  reorderList: async (listId: string, position: number): Promise<void> => {
    await api.put(`/lists/${listId}/reorder`, { position });
  },
};
