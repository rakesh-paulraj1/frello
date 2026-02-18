import api from "./api";

export interface TaskAssignment {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  createdBy: string;
  assignedUsers?: string[];
  assignments?: TaskAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface MoveTaskRequest {
  toListId: string;
  position: number;
}

export const taskService = {
  // Get all tasks for a list
  getTasks: async (listId: string): Promise<Task[]> => {
    const response = await api.get<{ data: Task[] }>(`/lists/${listId}/tasks`);
    return response.data.data;
  },

  // Create a new task in a list
  createTask: async (
    listId: string,
    title: string,
    description?: string,
  ): Promise<Task> => {
    const response = await api.post<Task>(`/lists/${listId}/tasks`, {
      title,
      description: description || null,
    });
    return response.data;
  },

  // Get single task details
  getTask: async (id: string): Promise<Task> => {
    const response = await api.get<{ data: Task }>(`/tasks/${id}`);
    return response.data.data;
  },

  // Update task
  updateTask: async (
    id: string,
    data: { title: string; description?: string },
  ): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  // Delete task
  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Move task to different list/position
  moveTask: async (
    taskId: string,
    toListId: string,
    position: number,
  ): Promise<void> => {
    await api.put(`/tasks/${taskId}/move`, { toListId, position });
  },

  // Assign task to user
  assignTask: async (taskId: string, userId: string): Promise<void> => {
    await api.post(`/tasks/${taskId}/assign`, { userId });
  },

  // Unassign task from user
  unassignTask: async (taskId: string, userId: string): Promise<void> => {
    await api.delete(`/tasks/${taskId}/assign/${userId}`);
  },
};
