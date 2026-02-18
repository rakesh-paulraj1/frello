import { Router } from 'express';
import { TasksController } from '../controllers/tasks.controller';
import passport from 'passport';

const router = Router();
const ctrl = new TasksController();

router.get('/lists/:listId/tasks', passport.authenticate('jwt', { session: false }), ctrl.list.bind(ctrl));
router.get('/boards/:boardId/tasks', passport.authenticate('jwt', { session: false }), ctrl.listByBoard.bind(ctrl));
router.post('/lists/:listId/tasks', passport.authenticate('jwt', { session: false }), ctrl.create.bind(ctrl));
router.get('/tasks/:id', passport.authenticate('jwt', { session: false }), ctrl.get.bind(ctrl));
router.put('/tasks/:id', passport.authenticate('jwt', { session: false }), ctrl.update.bind(ctrl));
router.delete('/tasks/:id', passport.authenticate('jwt', { session: false }), ctrl.remove.bind(ctrl));
router.put('/tasks/:id/move', passport.authenticate('jwt', { session: false }), ctrl.move.bind(ctrl));
router.post('/tasks/:id/assign', passport.authenticate('jwt', { session: false }), ctrl.assign.bind(ctrl));
router.delete('/tasks/:id/assign/:userId', passport.authenticate('jwt', { session: false }), ctrl.unassign.bind(ctrl));

export default router;
