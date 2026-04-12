import { Request, Response } from 'express';
import { BudgetService } from '../services/budget.service';
import { logger } from '@kharchabuddy/shared';

const budgetService = new BudgetService();

export class BudgetController {
  async createBudget(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const budget = await budgetService.createBudget({
        ...req.body,
        userId
      });

      res.status(201).json(budget);
    } catch (error) {
      logger.error({ err: error }, 'Failed to create budget');
      res.status(500).json({ error: 'Failed to create budget' });
    }
  }

  async getBudget(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;
      const budget = await budgetService.getBudgetById(budgetId);

      if (!budget) {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }

      res.json(budget);
    } catch (error) {
      logger.error({ err: error }, 'Failed to get budget');
      res.status(500).json({ error: 'Failed to get budget' });
    }
  }

  async getUserBudgets(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { period } = req.query;
      const budgets = await budgetService.getUserBudgets(userId, period as string);

      res.json(budgets);
    } catch (error) {
      logger.error({ err: error }, 'Failed to get user budgets');
      res.status(500).json({ error: 'Failed to get user budgets' });
    }
  }

  async getActiveBudget(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { period = 'monthly' } = req.query;
      const budget = await budgetService.getActiveBudget(userId, period as string);

      if (!budget) {
        res.status(404).json({ error: 'No active budget found' });
        return;
      }

      res.json(budget);
    } catch (error) {
      logger.error({ err: error }, 'Failed to get active budget');
      res.status(500).json({ error: 'Failed to get active budget' });
    }
  }

  async adjustBudget(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;
      const { trigger, reason } = req.body;

      const adjustment = await budgetService.adjustBudget(budgetId, trigger, reason);

      res.json(adjustment);
    } catch (error) {
      logger.error({ err: error }, 'Failed to adjust budget');
      res.status(500).json({ error: 'Failed to adjust budget' });
    }
  }

  async analyzeBudgetPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { period = 'monthly' } = req.query;
      const analysis = await budgetService.analyzeBudgetPerformance(userId, period as string);

      if (!analysis) {
        res.status(404).json({ error: 'No budget found for analysis' });
        return;
      }

      res.json(analysis);
    } catch (error) {
      logger.error({ err: error }, 'Failed to analyze budget performance');
      res.status(500).json({ error: 'Failed to analyze budget performance' });
    }
  }

  async enableSmartSaving(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await budgetService.enableSmartSaving(userId, req.body);

      res.json({ message: 'Smart saving enabled successfully' });
    } catch (error) {
      logger.error({ err: error }, 'Failed to enable smart saving');
      res.status(500).json({ error: 'Failed to enable smart saving' });
    }
  }
}
