import { Router } from 'express';
import { BoardsController } from '../controllers/boards.controller';
import passport from 'passport';

const router = Router();
const ctrl = new BoardsController();

router.get('/boards', passport.authenticate('jwt', { session: false }), ctrl.list.bind(ctrl));
router.post('/boards', passport.authenticate('jwt', { session: false }), ctrl.create.bind(ctrl));
router.get('/boards/:id', passport.authenticate('jwt', { session: false }), ctrl.get.bind(ctrl));
router.put('/boards/:id', passport.authenticate('jwt', { session: false }), ctrl.update.bind(ctrl));
export default router;
