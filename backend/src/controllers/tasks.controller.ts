import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { logActivity } from "../services/activity.service";
import { broadcastToBoard } from "../ws/wsServer";

export class TasksController {
  async list(req: Request, res: Response) {
    const listId = req.params.listId;
    if (!listId) return res.status(400).json({ error: "listId is required" });
    try {
      const headerQuery = (req.headers["x-search-query"] || req.headers["x-query"] || req.headers["search"] || null) as string | null;
      const qParam = (req.query.q as string) || null;
      const search = (headerQuery && headerQuery.trim()) || (qParam && qParam.trim()) || null;

      const where: any = { listId };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const tasks = await prisma.task.findMany({ where, orderBy: { position: "asc" } });
      res.json({ data: tasks });
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }

  async listByBoard(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: "Unauthorized" });
    const boardId = req.params.boardId;
    if (!boardId) return res.status(400).json({ error: "boardId is required" });
    try {
      const board = await prisma.board.findUnique({ where: { id: boardId } });
      if (!board) return res.status(404).json({ error: "Board not found." });
      if (!board.isPublic && board.ownerId !== userAny.id)
        return res.status(403).json({ error: "Forbidden." });

      const headerQuery = (req.headers["x-search-query"] || req.headers["x-query"] || req.headers["search"] || null) as string | null;
      const qParam = (req.query.q as string) || null;
      const search = (headerQuery && headerQuery.trim()) || (qParam && qParam.trim()) || null;

      const where: any = { list: { boardId } };
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const tasks = await prisma.task.findMany({ where, orderBy: { position: "asc" } });
      res.json({ data: tasks });
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }

  async create(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: "Unauthorized" });
    const listId = req.params.listId;
    const { title, description } = req.body;
    if (!listId) return res.status(400).json({ error: "listId is required" });
    if (!title) return res.status(400).json({ error: "Title is required." });
    try {
      const list = await prisma.list.findUnique({
        where: { id: listId },
        include: { board: true },
      });
      if (!list) return res.status(404).json({ error: "List not found." });
      if (list.board.ownerId !== userAny.id)
        return res.status(403).json({ error: "Forbidden." });

      const maxPos = await prisma.task.aggregate({
        where: { listId },
        _max: { position: true },
      });
      const nextPos = (maxPos._max.position ?? -1) + 1;

      const task = await prisma.task.create({
        data: {
          title,
          description: description ?? null,
          listId,
          position: nextPos,
          createdBy: userAny.id,
        },
      });
      broadcastToBoard(list.boardId, {
        type: "TASK_CREATED",
        boardId: list.boardId,
        actorId: userAny.id,
        payload: task,
      });

      try {
        await logActivity({
          boardId: list.boardId,
          userId: userAny.id,
          actionType: "CREATED",
          entityType: "TASK",
          entityId: task.id,
          metadata: { title, position: nextPos },
        });
      } catch (e) {
        console.error("Failed to log activity for task.create", e);
      }
      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }

  async get(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "id is required" });
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          list: { include: { board: true } },
          assignments: { include: { user: true } },
          creator: true,
        },
      });
      if (!task) return res.status(404).json({ error: "Task not found." });
      if (!task.list.board.isPublic && task.list.board.ownerId !== userAny.id)
        return res.status(403).json({ error: "Forbidden." });
      res.json({ data: task });
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }

  async update(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;
    const { title, description } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });
    if (!title) return res.status(400).json({ error: "Title is required." });
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { list: { include: { board: true } } },
      });
      if (!task) return res.status(404).json({ error: "Task not found." });
      if (task.list.board.ownerId !== userAny.id)
        return res.status(403).json({ error: "Forbidden." });
      const updated = await prisma.task.update({
        where: { id },
        data: { title, description: description ?? null },
      });

      // Broadcast
      broadcastToBoard(task.list.boardId, {
        type: "TASK_UPDATED",
        boardId: task.list.boardId,
        actorId: userAny.id,
        payload: updated,
      });

      try {
        await logActivity({
          boardId: task.list.boardId,
          userId: userAny.id,
          actionType: "UPDATED",
          entityType: "TASK",
          entityId: updated.id,
          metadata: { title },
        });
      } catch (e) {
        console.error("Failed to log activity for task.update", e);
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }

  async remove(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "id is required" });
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { list: true },
      });
      if (!task) return res.status(404).json({ error: "Task not found." });
      const list = await prisma.list.findUnique({
        where: { id: task.listId },
        include: { board: true },
      });
      if (!list) return res.status(404).json({ error: "List not found." });
      if (list.board.ownerId !== userAny.id)
        return res.status(403).json({ error: "Forbidden." });

      await prisma.$transaction([
        prisma.task.delete({ where: { id } }),
        prisma.task.updateMany({
          where: { listId: task.listId, position: { gt: task.position } },
          data: { position: { decrement: 1 } } as any,
        }),
      ]);

      // Broadcast
      broadcastToBoard(list.boardId, {
        type: "TASK_DELETED",
        boardId: list.boardId,
        actorId: userAny.id,
        payload: { id, listId: task.listId },
      });

      try {
        await logActivity({
          boardId: list.boardId,
          userId: userAny.id,
          actionType: "DELETED",
          entityType: "TASK",
          entityId: id,
          metadata: { position: task.position, title: task.title },
        });
      } catch (e) {
        console.error("Failed to log activity for task.delete", e);
      }

      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }

  async move(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;
    const { toListId, position } = req.body as {
      toListId?: string;
      position?: number;
    };
    if (!id) return res.status(400).json({ error: "id is required" });
    if (!toListId)
      return res.status(400).json({ error: "toListId is required" });
    if (position === undefined || position === null)
      return res.status(400).json({ error: "position is required" });
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { list: true },
      });
      if (!task) return res.status(404).json({ error: "Task not found." });
      const sourceList = await prisma.list.findUnique({
        where: { id: task.listId },
        include: { board: true },
      });
      const targetList = await prisma.list.findUnique({
        where: { id: toListId },
        include: { board: true },
      });
      if (!sourceList || !targetList)
        return res.status(404).json({ error: "List not found." });
      if (
        sourceList.board.ownerId !== userAny.id ||
        targetList.board.ownerId !== userAny.id
      )
        return res.status(403).json({ error: "Forbidden." });
      const targetCount = await prisma.task.count({
        where: { listId: toListId },
      });
      const newPos = Math.max(0, Math.min(position, targetCount));
      const oldPos = task.position;

      // Use array form of $transaction to keep TypeScript happy with generated client types
      const ops: any[] = [];
      if (task.listId === toListId) {
        if (newPos < oldPos) {
          ops.push(
            prisma.task.updateMany({
              where: {
                listId: toListId,
                position: { gte: newPos, lt: oldPos },
              },
              data: { position: { increment: 1 } } as any,
            }),
          );
        } else if (newPos > oldPos) {
          ops.push(
            prisma.task.updateMany({
              where: {
                listId: toListId,
                position: { gt: oldPos, lte: newPos },
              },
              data: { position: { decrement: 1 } } as any,
            }),
          );
        }
        ops.push(prisma.task.update({ where: { id }, data: { position: newPos } }));
      } else {
        ops.push(
          prisma.task.updateMany({
            where: { listId: task.listId, position: { gt: oldPos } },
            data: { position: { decrement: 1 } } as any,
          }),
        );
        ops.push(
          prisma.task.updateMany({
            where: { listId: toListId, position: { gte: newPos } },
            data: { position: { increment: 1 } } as any,
          }),
        );
        ops.push(
          prisma.task.update({
            where: { id },
            data: { listId: toListId, position: newPos },
          }),
        );
      }

      if (ops.length) await prisma.$transaction(ops);

    
      broadcastToBoard(sourceList.board.id, {
        type: "TASK_MOVED",
        boardId: sourceList.board.id,
        actorId: userAny.id,
        payload: { id, fromListId: task.listId, toListId, position: newPos },
      });

      try {
        await logActivity({
          boardId: sourceList.board.id,
          userId: userAny.id,
          actionType: "MOVED",
          entityType: "TASK",
          entityId: id,
          metadata: {
            from: oldPos,
            to: newPos,
            fromListId: task.listId,
            toListId,
            fromListTitle: sourceList.title,
            toListTitle: targetList.title,
            taskTitle: task.title,
          },
        });
      } catch (e) {
        console.error("Failed to log activity for task.move", e);
      }

      res.json({ message: "Moved" });
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }

  async assign(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;
    const { userId } = req.body as { userId?: string };
    if (!id) return res.status(400).json({ error: "id is required" });
    if (!userId) return res.status(400).json({ error: "userId is required" });
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { list: { include: { board: true } } },
      });
      if (!task) return res.status(404).json({ error: "Task not found." });
      if (task.list.board.ownerId !== userAny.id)
        return res.status(403).json({ error: "Forbidden." });

      const existing = await prisma.taskAssignment.findUnique({
        where: { taskId_userId: { taskId: id, userId } } as any,
      });
      if (existing) return res.status(409).json({ error: "Already assigned." });

      await prisma.taskAssignment.create({ data: { taskId: id, userId } });

      // Broadcast
      broadcastToBoard(task.list.boardId, {
        type: "TASK_ASSIGNED",
        boardId: task.list.boardId,
        actorId: userAny.id,
        payload: { taskId: id, userId },
      });

      try {
        await logActivity({
          boardId: task.list.boardId,
          userId: userAny.id,
          actionType: "CREATED",
          entityType: "TASK",
          entityId: id,
          metadata: { assignedUserId: userId },
        });
      } catch (e) {
        console.error("Failed to log activity for task.assign", e);
      }
      res.status(201).json({ message: "Assigned" });
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }

  async unassign(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: "Unauthorized" });
    const id = req.params.id;
    const userId = req.params.userId;
    if (!id || !userId)
      return res.status(400).json({ error: "id and userId are required" });
    try {
      const task = await prisma.task.findUnique({
        where: { id },
        include: { list: { include: { board: true } } },
      });
      if (!task) return res.status(404).json({ error: "Task not found." });
      if (task.list.board.ownerId !== userAny.id)
        return res.status(403).json({ error: "Forbidden." });

      await prisma.taskAssignment.deleteMany({ where: { taskId: id, userId } });

      // Broadcast
      broadcastToBoard(task.list.boardId, {
        type: "TASK_UNASSIGNED",
        boardId: task.list.boardId,
        actorId: userAny.id,
        payload: { taskId: id, userId },
      });

      try {
        await logActivity({
          boardId: task.list.boardId,
          userId: userAny.id,
          actionType: "DELETED",
          entityType: "TASK",
          entityId: id,
          metadata: { unassignedUserId: userId },
        });
      } catch (e) {
        console.error("Failed to log activity for task.unassign", e);
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Internal server error." });
    }
  }
}
