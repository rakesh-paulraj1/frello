import { Request, Response } from 'express';

export class ListsController {
  async list(req: Request, res: Response) {
    res.json({ data: [], message: 'list lists - implement' });
  }

  async create(req: Request, res: Response) {
    res.status(201).json({ data: null, message: 'create list - implement' });
  }

  async update(req: Request, res: Response) {
    res.json({ data: null, message: 'update list - implement' });
  }

  async remove(req: Request, res: Response) {
    res.status(204).send();
  }

  async reorder(req: Request, res: Response) {
    res.json({ message: 'reorder list - implement' });
  }
}
