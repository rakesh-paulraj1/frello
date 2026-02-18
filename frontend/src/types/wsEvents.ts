// Mirror of backend/src/ws/wsEvents.ts
export type WsEventType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_MOVED"
  | "TASK_ASSIGNED"
  | "TASK_UNASSIGNED"
  | "LIST_CREATED"
  | "LIST_UPDATED"
  | "LIST_DELETED"
  | "LIST_REORDERED"
  | "BOARD_UPDATED";

export interface WsEvent {
  type: WsEventType;
  boardId: string;
  actorId: string;
  payload: unknown;
}


export interface TaskPayload {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  createdBy: string;
  assignments?: Array<{
    userId: string;
    user: { id: string; name: string; email: string };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDeletedPayload {
  id: string;
  listId: string;
}

export interface TaskMovedPayload {
  id: string;
  fromListId: string;
  toListId: string;
  position: number;
}

export interface TaskAssignmentPayload {
  taskId: string;
  userId: string;
}

export interface ListPayload {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListDeletedPayload {
  id: string; 
  boardId: string;
}

export interface ListReorderedPayload {
  id: string; 
  boardId: string;
  position: number; 
}

export interface BoardUpdatedPayload {
  id: string;
  title: string;
}
