import { Request, Response } from 'express';
import { NudgeService } from '../services/nudge.service';
import { logger } from '@kharchabuddy/shared';

const nudgeService = new NudgeService();

export class NudgeController {
  async getUserNudges(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { limit = 20 } = req.query;
      const nudges = await nudgeService.getUserNudges(userId, parseInt(limit as string));

      res.json(nudges);
    } catch (error) {
      logger.error({ err: error }, 'Failed to get user nudges');
      res.status(500).json({ error: 'Failed to get user nudges' });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { nudgeId } = req.params;
      await nudgeService.markNudgeAsRead(nudgeId);

      res.json({ message: 'Nudge marked as read' });
    } catch (error) {
      logger.error({ err: error }, 'Failed to mark nudge as read');
      res.status(500).json({ error: 'Failed to mark nudge as read' });
    }
  }

  async markAsActed(req: Request, res: Response): Promise<void> {
    try {
      const { nudgeId } = req.params;
      await nudgeService.markNudgeAsActed(nudgeId);

      res.json({ message: 'Nudge marked as acted' });
    } catch (error) {
      logger.error({ err: error }, 'Failed to mark nudge as acted');
      res.status(500).json({ error: 'Failed to mark nudge as acted' });
    }
  }

  async dismissNudge(req: Request, res: Response): Promise<void> {
    try {
      const { nudgeId } = req.params;
      await nudgeService.dismissNudge(nudgeId);

      res.json({ message: 'Nudge dismissed' });
    } catch (error) {
      logger.error({ err: error }, 'Failed to dismiss nudge');
      res.status(500).json({ error: 'Failed to dismiss nudge' });
    }
  }

  async getNudgeEffectiveness(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const effectiveness = await nudgeService.getNudgeEffectiveness(userId);

      res.json(effectiveness);
    } catch (error) {
      logger.error({ err: error }, 'Failed to get nudge effectiveness');
      res.status(500).json({ error: 'Failed to get nudge effectiveness' });
    }
  }
}
