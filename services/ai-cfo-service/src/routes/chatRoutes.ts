import { Router } from 'express';
import { chat, chatStream } from '../services/aiCFOService';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const chatSchema = z.object({
  userId: z.string(),
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
});

router.post('/', validateRequest(chatSchema), async (req, res, next) => {
  try {
    const result = await chat(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/stream', validateRequest(chatSchema), async (req, res, next) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of chatStream(req.body)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    next(error);
  }
});

export default router;
