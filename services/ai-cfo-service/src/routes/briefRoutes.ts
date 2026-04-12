import { Router } from 'express';
import { generateDailyBrief } from '../services/briefService';

const router = Router();

router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const brief = await generateDailyBrief(userId);
    res.json(brief);
  } catch (error) {
    next(error);
  }
});

router.post('/:userId/generate', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const brief = await generateDailyBrief(userId);
    res.json(brief);
  } catch (error) {
    next(error);
  }
});

export default router;
