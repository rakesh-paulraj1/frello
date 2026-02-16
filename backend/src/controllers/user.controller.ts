


import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { prisma } from '../config/prisma';


function cookieOptions() {
   return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
   };
}

export class Usercontroller {
   public async signup(req: Request, res: Response): Promise<void> {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
         res.status(400).json({ error: 'All fields are required.' });
         return;
      }
      try {
         const existingUser = await prisma.user.findUnique({ where: { email } });
         if (existingUser) {
            res.status(409).json({ error: 'Email already registered.' });
            return;
         }
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
               data: { name, email, password: hashedPassword },
            });
            const token = jwt.sign({ id: user.id, email: user.email, name: user.name },process.env.JWT_SECRET!, { expiresIn: '7d' });
            res.cookie('token', token, cookieOptions());
            res.status(201).json({user: { id: user.id, name: user.name, email: user.email } });
      } catch (err) {
         res.status(500).json({ error: 'Internal server error.' });
      }
   }

   public async login(req: Request, res: Response): Promise<void> {
      passport.authenticate('local', { session: false }, (err: any, user: any, info: any) => {
         if (err) return res.status(500).json({ error: 'Authentication error.' });
         if (!user) return res.status(401).json({ error: info?.message || 'Invalid credentials.' });
         try {
            const token = jwt.sign({ id: user.id, email: user.email, name: user.name },process.env.JWT_SECRET!, { expiresIn: '7d' });
            res.cookie('token', token, cookieOptions());
            res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
         } catch (err) {
            res.status(500).json({ error: 'Internal server error.' });
         }
      })(req, res);
   }

   public async me(req: Request, res: Response): Promise<void> {
      const userAny = (req as any).user;
      if (!userAny) {
         res.status(401).json({ error: 'Unauthorized' });
         return;
      }
      res.json({ id: userAny.id, name: userAny.name, email: userAny.email });
   }
}