import { Router } from 'express';
import { ListsController } from '../controllers/lists.controller';
import passport from 'passport';

const router = Router();
const ctrl = new ListsController();

router.get('/boards/:boardId/lists', passport.authenticate('jwt', { session: false }), ctrl.list.bind(ctrl));
router.post('/boards/:boardId/lists', passport.authenticate('jwt', { session: false }), ctrl.create.bind(ctrl));
router.put('/lists/:id', passport.authenticate('jwt', { session: false }), ctrl.update.bind(ctrl));
router.delete('/lists/:id', passport.authenticate('jwt', { session: false }), ctrl.remove.bind(ctrl));
router.put('/lists/:id/reorder', passport.authenticate('jwt', { session: false }), ctrl.reorder.bind(ctrl));

export default router;
