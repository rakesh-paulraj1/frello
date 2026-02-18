import { prisma } from '../config/prisma';

export type ActionType = 'CREATED' | 'UPDATED' | 'DELETED' | 'MOVED';
export type EntityType = 'TASK' | 'LIST' | 'BOARD';

export async function logActivity(opts: {
  boardId: string;
  userId: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  metadata?: any;
  tx?: any;
}) {
  const repo = opts.tx ?? prisma;
  return repo.activityLog.create({
    data: {
      boardId: opts.boardId,
      userId: opts.userId,
      actionType: opts.actionType,
      entityType: opts.entityType,
      entityId: opts.entityId,
      metadata: opts.metadata ?? {},
    },
  });
}

export default { logActivity };
