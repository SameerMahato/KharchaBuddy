import { BudgetService } from '../services/budget.service';
import { NudgeService } from '../services/nudge.service';
import { Budget } from '../models/budget.model';
import { logger } from '@kharchabuddy/shared';

const budgetService = new BudgetService();
const nudgeService = new NudgeService();

export async function handleTransactionCreated(event: any): Promise<void> {
  try {
    const { userId, category, amount, type } = event;

    if (type !== 'expense') return;

    // Update budget spending
    await budgetService.updateSpending(userId, category, amount);

    // Get updated budget to check thresholds
    const budget = await Budget.findOne({
      userId,
      'categories.category': category
    });

    if (!budget) return;

    const categoryBudget = budget.categories.find(c => c.category === category);
    if (!categoryBudget) return;

    // Check if nudge should be sent
    await nudgeService.checkBudgetThresholds(
      userId,
      category,
      categoryBudget.spent,
      categoryBudget.allocated
    );

    logger.info({ userId, category, amount }, 'Transaction processed for budget');
  } catch (error) {
    logger.error({ err: error, event }, 'Failed to handle transaction created event');
  }
}
