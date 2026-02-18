import api from "./api";

export interface ActivityUser {
  id: string;
  name: string;
  email: string;
}

export interface ActivityMetadata {

  title?: string;
  taskTitle?: string;
  listTitle?: string;

  from?: number;
  to?: number;
  fromListId?: string;
  toListId?: string;
  fromListTitle?: string;
  toListTitle?: string;

  [key: string]: unknown;
}

export interface ActivityLog {
  id: string;
  boardId: string;
  userId: string;
  actionType?: string;
  entityType?: string;
  entityId: string;
  metadata: ActivityMetadata | null;
  createdAt: string;
  user: ActivityUser;
}

export interface ActivityResponse {
  data: ActivityLog[];
}

export const activityService = {
  getLogs: async (
    boardId: string,
    page = 0,
    per = 50,
  ): Promise<ActivityLog[]> => {
    const response = await api.get<ActivityResponse>(
      `/boards/${boardId}/activity`,
      { params: { page, per } },
    );
    return response.data.data;
  },
};
