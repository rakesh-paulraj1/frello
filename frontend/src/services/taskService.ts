import api from "./api";

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  listId: string;
  title: string;
  description?: string;
  position: number;
}

export interface MoveTaskRequest {
  newListId: string;
  position: number;
}

export const taskService = {
  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    const response = await api.post<Task>("/tasks", data);
    return response.data;
  },

  updateTask: async (
    id: string,
    data: Partial<CreateTaskRequest>,
  ): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  moveTask: async (taskId: string, data: MoveTaskRequest): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${taskId}/move`, data);
    return response.data;
  },
};
