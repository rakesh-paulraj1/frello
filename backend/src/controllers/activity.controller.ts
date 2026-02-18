import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class ActivityController {
  async list(req: Request, res: Response) {
    const boardId = (req.query.boardId as string) || req.params.boardId;
    if (!boardId) return res.status(400).json({ error: 'boardId is required' });
    const page = Number(req.query.page || 0);
    const per = Math.min(100, Number(req.query.per || 50));
    try {
      const logs = await prisma.activityLog.findMany({
        where: { boardId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: page * per,
        take: per,
      });
      const listIds = new Set<string>();
      const taskIds = new Set<string>();
      for (const l of logs) {
        const md: any = (l as any).metadata ?? {};
        if (md?.fromListId && !md?.fromListTitle) listIds.add(md.fromListId);
        if (md?.toListId && !md?.toListTitle) listIds.add(md.toListId);
        if (md?.listTitle && !md?.listTitle) listIds.add(md.listTitle);
        if ((l as any).entityType === 'LIST' && !(md?.listTitle)) listIds.add((l as any).entityId);
        if ((l as any).entityType === 'TASK' && !(md?.taskTitle)) taskIds.add((l as any).entityId);
      }

      const [lists, tasks] = await Promise.all([
        listIds.size ? prisma.list.findMany({ where: { id: { in: Array.from(listIds) } }, select: { id: true, title: true } }) : Promise.resolve([]),
        taskIds.size ? prisma.task.findMany({ where: { id: { in: Array.from(taskIds) } }, select: { id: true, title: true } }) : Promise.resolve([]),
      ] as const);

      const listMap = new Map(lists.map((x: any) => [x.id, x.title]));
      const taskMap = new Map(tasks.map((x: any) => [x.id, x.title]));

      const enriched = logs.map((l: any) => {
        const md: any = (l as any).metadata ?? {};
        try {
          if (md.fromListId && !md.fromListTitle && listMap.has(md.fromListId)) md.fromListTitle = listMap.get(md.fromListId);
          if (md.toListId && !md.toListTitle && listMap.has(md.toListId)) md.toListTitle = listMap.get(md.toListId);
          if ((l as any).entityType === 'LIST' && !md.listTitle && listMap.has((l as any).entityId)) md.listTitle = listMap.get((l as any).entityId);
          if ((l as any).entityType === 'TASK' && !md.taskTitle && taskMap.has((l as any).entityId)) md.taskTitle = taskMap.get((l as any).entityId);
        } catch (e) {
        }
        return { ...l, metadata: md };
      });

      res.json({ data: enriched });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}
