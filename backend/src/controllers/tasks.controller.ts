import { Request, Response } from 'express';

export class TasksController {
  async list(req: Request, res: Response) {
    res.json({ data: [], message: 'list tasks - implement' });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: null, message: 'create task - implement' });
  }

  async get(req: Request, res: Response) {
    res.json({ data: null, message: 'get task - implement' });
  }

  async update(req: Request, res: Response) {
    res.json({ data: null, message: 'update task - implement' });
  }

  async remove(req: Request, res: Response) {
    res.status(204).send();
  }

  async move(req: Request, res: Response) {
    res.json({ message: 'move task - implement' });
  }

  async assign(req: Request, res: Response) {
    res.status(201).json({ message: 'assign task - implement' });
  }

  async unassign(req: Request, res: Response) {
    res.status(204).send();
  }
}
