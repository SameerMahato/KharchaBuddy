import { Budget, IBudget, CategoryBudget, BudgetAdjustment, CategoryChange } from '../models/budget.model';
import { logger } from '@kharchabuddy/shared';
import { publishEvent } from '../config/kafka';
import { getRedisClient } from '../config/redis';

export class BudgetService {
  async createBudget(data: Partial<IBudget>): Promise<IBudget> {
    // Validate total equals sum of categories
    const totalAllocated = data.categories?.reduce((sum, cat) => sum + cat.allocated, 0) || 0;
    if (Math.abs(totalAllocated - (data.totalAmount || 0)) > 0.01) {
      throw new Error('Total amount must equal sum of category allocations');
    }

    // Calculate percentages and remaining
    const categories = data.categories?.map(cat => ({
      ...cat,
      percentage: (cat.allocated / (data.totalAmount || 1)) * 100,
      remaining: cat.allocated - (cat.spent || 0)
    })) || [];

    const budget = new Budget({
      ...data,
      categories,
      version: 0
    });

    await budget.save();
    logger.info({ budgetId: budget._id, userId: budget.userId }, 'Budget created');

    await publishEvent('budget.created', {
      budgetId: budget._id,
      userId: budget.userId,
      totalAmount: budget.totalAmount,
      period: budget.period
    });

    return budget;
  }

  async getBudgetById(budgetId: string): Promise<IBudget | null> {
    return Budget.findById(budgetId);
  }

  async getUserBudgets(userId: string, period?: string): Promise<IBudget[]> {
    const query: any = { userId };
    if (period) query.period = period;
    return Budget.find(query).sort({ startDate: -1 });
  }

  async getActiveBudget(userId: string, period: string = 'monthly'): Promise<IBudget | null> {
    const now = new Date();
    return Budget.findOne({
      userId,
      period,
      startDate: { $lte: now },
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: now } }
      ]
    });
  }

  async updateSpending(userId: string, category: string, amount: number): Promise<void> {
    const budget = await this.getActiveBudget(userId);
    if (!budget) return;

    const categoryBudget = budget.categories.find(c => c.category === category);
    if (!categoryBudget) return;

    categoryBudget.spent += amount;
    categoryBudget.remaining = categoryBudget.allocated - categoryBudget.spent;

    await budget.save();
    logger.info({ budgetId: budget._id, category, spent: categoryBudget.spent }, 'Budget spending updated');

    // Check if adjustment needed
    if (budget.isAdaptive) {
      await this.checkAndAdjustBudget(budget);
    }
  }

  async adjustBudget(budgetId: string, trigger: string, reason: string): Promise<BudgetAdjustment> {
    const budget = await Budget.findById(budgetId);
    if (!budget) throw new Error('Budget not found');

    const adjustments: CategoryChange[] = [];
    const spending = budget.categories.reduce((acc, cat) => {
      acc[cat.category] = cat.spent;
      return acc;
    }, {} as Record<string, number>);

    // Calculate adjustments for each category
    for (const categoryBudget of budget.categories) {
      const spent = spending[categoryBudget.category] || 0;
      const utilization = spent / categoryBudget.allocated;

      let adjustmentFactor = 0;
      let adjustReason = '';

      if (utilization > 1.2 && categoryBudget.isFlexible) {
        adjustmentFactor = 0.15;
        adjustReason = `Consistently overspending in ${categoryBudget.category}`;
      } else if (utilization < 0.5 && categoryBudget.isFlexible) {
        adjustmentFactor = -0.10;
        adjustReason = `Underutilizing ${categoryBudget.category} budget`;
      }

      if (adjustmentFactor !== 0) {
        const newAllocation = Math.round(categoryBudget.allocated * (1 + adjustmentFactor));
        adjustments.push({
          category: categoryBudget.category,
          oldAllocation: categoryBudget.allocated,
          newAllocation,
          change: newAllocation - categoryBudget.allocated,
          reason: adjustReason
        });
      }
    }

    // Rebalance to maintain total
    const totalChange = adjustments.reduce((sum, adj) => sum + adj.change, 0);
    if (Math.abs(totalChange) > 0.01) {
      const flexibleCategories = budget.categories.filter(c =>
        c.isFlexible && !adjustments.find(a => a.category === c.category)
      );

      if (flexibleCategories.length > 0) {
        const perCategoryAdjustment = -totalChange / flexibleCategories.length;
        for (const category of flexibleCategories) {
          adjustments.push({
            category: category.category,
            oldAllocation: category.allocated,
            newAllocation: Math.round(category.allocated + perCategoryAdjustment),
            change: perCategoryAdjustment,
            reason: 'Rebalancing adjustment'
          });
        }
      }
    }

    // Apply adjustments
    for (const adjustment of adjustments) {
      const categoryBudget = budget.categories.find(c => c.category === adjustment.category);
      if (categoryBudget) {
        categoryBudget.allocated = adjustment.newAllocation;
        categoryBudget.remaining = adjustment.newAllocation - categoryBudget.spent;
        categoryBudget.percentage = (adjustment.newAllocation / budget.totalAmount) * 100;
      }
    }

    const budgetAdjustment: BudgetAdjustment = {
      timestamp: new Date(),
      reason,
      changes: adjustments,
      triggeredBy: 'system'
    };

    budget.adjustmentHistory.push(budgetAdjustment);
    budget.version += 1;
    await budget.save();

    logger.info({ budgetId: budget._id, adjustments }, 'Budget adjusted');

    await publishEvent('budget.adjusted', {
      budgetId: budget._id,
      userId: budget.userId,
      adjustments,
      reason
    });

    return budgetAdjustment;
  }

  private async checkAndAdjustBudget(budget: IBudget): Promise<void> {
    const needsAdjustment = budget.categories.some(cat => {
      const utilization = cat.spent / cat.allocated;
      return (utilization > 1.2 || utilization < 0.5) && cat.isFlexible;
    });

    if (needsAdjustment) {
      await this.adjustBudget(budget._id.toString(), 'auto', 'Automatic adjustment based on spending patterns');
    }
  }

  async analyzeBudgetPerformance(userId: string, period: string): Promise<any> {
    const budget = await this.getActiveBudget(userId, period);
    if (!budget) return null;

    const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spent, 0);
    const totalAllocated = budget.totalAmount;
    const utilizationRate = (totalSpent / totalAllocated) * 100;

    const categoryPerformance = budget.categories.map(cat => ({
      category: cat.category,
      allocated: cat.allocated,
      spent: cat.spent,
      remaining: cat.remaining,
      utilizationRate: (cat.spent / cat.allocated) * 100,
      status: cat.spent > cat.allocated ? 'overspent' : cat.spent > cat.allocated * 0.9 ? 'near_limit' : 'on_track'
    }));

    return {
      budgetId: budget._id,
      period: budget.period,
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      utilizationRate,
      categoryPerformance,
      adjustmentCount: budget.adjustmentHistory.length,
      lastAdjustment: budget.adjustmentHistory[budget.adjustmentHistory.length - 1]
    };
  }

  async enableSmartSaving(userId: string, config: any): Promise<void> {
    const budget = await this.getActiveBudget(userId);
    if (!budget) throw new Error('No active budget found');

    budget.smartSavingEnabled = true;
    budget.smartSavingConfig = config;
    await budget.save();

    logger.info({ userId, config }, 'Smart saving enabled');
  }
}
