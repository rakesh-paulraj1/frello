import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export class BoardsController {
  async list(req: Request, res: Response) {
    const userAny = (req as any).user;
    try {
      const where = userAny
        ? { OR: [{ isPublic: true }, { ownerId: userAny.id }] }
        : { isPublic: true };
      const boards = await prisma.board.findMany({
        where,
        select: { id: true, title: true, isPublic: true, ownerId: true },
      });
      if (!boards || boards.length === 0) return res.json({ data: [], message: 'no boards available' });
      res.json({ data: boards });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  async create(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: 'Unauthorized' });
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    try {
      const board = await prisma.board.create({
        data: { title, ownerId: userAny.id, isPublic: true },
      });
      res.status(201).json(board);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  async get(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: 'Unauthorized' });
    const boardId = req.params.id;
    try {
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        include: { lists: { orderBy: { position: 'asc' } } },
      });
      if (!board) return res.status(404).json({ error: 'Board not found.' });
      if (!board.isPublic && board.ownerId !== userAny.id) return res.status(403).json({ error: 'Forbidden.' });
      res.json({ board: { id: board.id, title: board.title, isPublic: board.isPublic, lists: board.lists } });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  async update(req: Request, res: Response) {
    const userAny = (req as any).user;
    if (!userAny) return res.status(401).json({ error: 'Unauthorized' });
    const boardId = req.params.id;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });
    try {
      const board = await prisma.board.findUnique({ where: { id: boardId } });
      if (!board) return res.status(404).json({ error: 'Board not found.' });
      if (board.ownerId !== userAny.id) return res.status(403).json({ error: 'Forbidden.' });
      const updated = await prisma.board.update({ where: { id: boardId }, data: { title } });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

}
