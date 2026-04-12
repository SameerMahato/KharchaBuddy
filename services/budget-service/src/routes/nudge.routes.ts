import { Router } from 'express';
import { NudgeController } from '../controllers/nudge.controller';

const router = Router();
const nudgeController = new NudgeController();

router.get('/', nudgeController.getUserNudges.bind(nudgeController));
router.get('/effectiveness', nudgeController.getNudgeEffectiveness.bind(nudgeController));
router.patch('/:nudgeId/read', nudgeController.markAsRead.bind(nudgeController));
router.patch('/:nudgeId/acted', nudgeController.markAsActed.bind(nudgeController));
router.delete('/:nudgeId', nudgeController.dismissNudge.bind(nudgeController));

export default router;
