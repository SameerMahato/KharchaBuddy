import { Nudge, INudge, Action } from '../models/nudge.model';
import { Budget } from '../models/budget.model';
import { logger } from '@kharchabuddy/shared';
import { getRedisClient } from '../config/redis';

export class NudgeService {
  async checkBudgetThresholds(userId: string, category: string, spent: number, allocated: number): Promise<void> {
    const percentage = (spent / allocated) * 100;
    const redis = getRedisClient();

    // Check daily nudge limit
    const nudgeCountKey = `nudge:count:${userId}:${new Date().toISOString().split('T')[0]}`;
    const nudgeCount = await redis.get(nudgeCountKey);
    if (nudgeCount && parseInt(nudgeCount) >= 3) {
      logger.info({ userId }, 'Daily nudge limit reached');
      return;
    }

    // Check if nudge already sent for this threshold
    const nudgeKey = `nudge:sent:${userId}:${category}:${Math.floor(percentage / 5) * 5}`;
    const alreadySent = await redis.get(nudgeKey);
    if (alreadySent) return;

    let nudge: Partial<INudge> | null = null;

    if (percentage >= 90) {
      nudge = {
        userId,
        category,
        type: 'warning',
        message: `You've spent ${percentage.toFixed(0)}% of your ${category} budget. Consider slowing down to avoid overspending.`,
        tone: 'firm',
        actionable: true,
        actions: [
          { type: 'view_budget', label: 'View Budget' },
          { type: 'adjust_budget', label: 'Adjust Budget' },
          { type: 'view_transactions', label: 'View Transactions' }
        ],
        trigger: {
          type: 'budget_threshold',
          threshold: 90,
          currentValue: percentage
        },
        channels: ['push', 'email']
      };
    } else if (percentage >= 75) {
      nudge = {
        userId,
        category,
        type: 'suggestion',
        message: `You're at ${percentage.toFixed(0)}% of your ${category} budget. You're doing well, but keep an eye on your spending.`,
        tone: 'gentle',
        actionable: true,
        actions: [
          { type: 'view_budget', label: 'View Budget' },
          { type: 'view_alternatives', label: 'Find Alternatives' }
        ],
        trigger: {
          type: 'budget_threshold',
          threshold: 75,
          currentValue: percentage
        },
        channels: ['push']
      };
    }

    if (nudge) {
      const budget = await Budget.findOne({ userId, 'categories.category': category });
      if (budget) {
        nudge.budgetId = budget._id.toString();
      }

      const savedNudge = await this.sendNudge(nudge as INudge);

      // Mark as sent and increment count
      await redis.setex(nudgeKey, 86400, '1'); // 24 hours
      await redis.incr(nudgeCountKey);
      await redis.expire(nudgeCountKey, 86400);

      logger.info({ nudgeId: savedNudge._id, userId, category, percentage }, 'Nudge sent');
    }
  }

  async sendNudge(data: Partial<INudge>): Promise<INudge> {
    const nudge = new Nudge({
      ...data,
      status: 'sent',
      sentAt: new Date()
    });

    await nudge.save();

    // TODO: Send actual notifications via channels (email, SMS, push)
    // This would integrate with notification service

    return nudge;
  }

  async getUserNudges(userId: string, limit: number = 20): Promise<INudge[]> {
    return Nudge.find({ userId })
      .sort({ sentAt: -1 })
      .limit(limit);
  }

  async markNudgeAsRead(nudgeId: string): Promise<void> {
    await Nudge.findByIdAndUpdate(nudgeId, {
      status: 'read',
      readAt: new Date()
    });
  }

  async markNudgeAsActed(nudgeId: string): Promise<void> {
    await Nudge.findByIdAndUpdate(nudgeId, {
      status: 'acted',
      actedAt: new Date()
    });
  }

  async dismissNudge(nudgeId: string): Promise<void> {
    await Nudge.findByIdAndUpdate(nudgeId, {
      status: 'dismissed'
    });
  }

  async getNudgeEffectiveness(userId: string): Promise<any> {
    const nudges = await Nudge.find({ userId });

    const total = nudges.length;
    const read = nudges.filter(n => n.status === 'read' || n.status === 'acted').length;
    const acted = nudges.filter(n => n.status === 'acted').length;
    const dismissed = nudges.filter(n => n.status === 'dismissed').length;

    return {
      total,
      read,
      acted,
      dismissed,
      readRate: total > 0 ? (read / total) * 100 : 0,
      actionRate: total > 0 ? (acted / total) * 100 : 0,
      dismissRate: total > 0 ? (dismissed / total) * 100 : 0
    };
  }
}
