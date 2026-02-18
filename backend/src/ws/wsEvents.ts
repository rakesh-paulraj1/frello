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
