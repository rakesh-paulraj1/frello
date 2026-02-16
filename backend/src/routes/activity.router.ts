import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';

import passport from 'passport';

const router = Router();
const ctrl = new ActivityController();

router.get('/boards/:boardId/activity', passport.authenticate('jwt', { session: false }), ctrl.list.bind(ctrl));

export default router;
