import { Request, Response } from 'express';

export class ActivityController {
  async list(req: Request, res: Response) {
    res.json({ data: [], message: 'board activity - implement' });
  }
}
