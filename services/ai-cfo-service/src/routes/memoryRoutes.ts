import { Router } from 'express';
import { getUserMemory, updateUserMemory, clearUserMemory } from '../services/memoryService';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const memoryUpdateSchema = z.object({
  spendingPatterns: z.string().optional(),
  preferences: z.string().optional(),
  financialPersonality: z.string().optional(),
  goals: z.array(z.string()).optional(),
});

router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const memory = await getUserMemory(userId);
    res.json(memory || { message: 'No memory found for user' });
  } catch (error) {
    next(error);
  }
});

router.post('/:userId', validateRequest(memoryUpdateSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    await updateUserMemory(userId, req.body);
    res.json({ message: 'Memory updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    await clearUserMemory(userId);
    res.json({ message: 'Memory cleared successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
