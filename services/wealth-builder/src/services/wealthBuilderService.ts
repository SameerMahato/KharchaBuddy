import FinancialGoal, { IFinancialGoal, IContribution } from '../models/FinancialGoal';
import RoundUpConfig, { IRoundUpConfig } from '../models/RoundUpConfig';

interface GoalProgress {
  goalId: string;
  name: string;
  percentageComplete: number;
  amountRemaining: number;
  daysRemaining: number;
  onTrack: boolean;
  projectedCompletionDate: Date;
  nextMilestone?: {
    percentage: number;
    amount: number;
    targetDate: Date;
  };
}

interface RoundUpResult {
  transactionAmount: number;
  roundUpAmount: number;
  totalAmount: number;
  goalUpdated: boolean;
}

export class WealthBuilderService {
  async createGoal(userId: string, goalData: Partial<IFinancialGoal>): Promise<IFinancialGoal> {
    // Validate dates
    if (goalData.targetDate && goalData.startDate) {
      if (new Date(goalData.targetDate) <= new Date(goalData.startDate)) {
        throw new Error('Target date must be after start date');
      }
    }

    // Validate amounts
    if (goalData.targetAmount && goalData.currentAmount) {
      if (goalData.currentAmount > goalData.targetAmount) {
        throw new Error('Current amount cannot exceed target amount');
      }
    }

    // Generate milestones
    const milestones = this.generateMilestones(
      goalData.targetAmount || 0,
      goalData.startDate || new Date(),
      goalData.targetDate || new Date()
    );

    const goal = new FinancialGoal({
      ...goalData,
      userId,
      currentAmount: goalData.currentAmount || 0,
      milestones,
      contributions: [],
      status: 'active'
    });

    await goal.save();
    return goal;
  }

  async addContribution(
    goalId: string,
    amount: number,
    source: 'manual' | 'auto' | 'roundup' = 'manual'
  ): Promise<IFinancialGoal> {
    const goal = await FinancialGoal.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    if (goal.status !== 'active') {
      throw new Error('Cannot contribute to inactive goal');
    }

    // Add contribution
    const contribution: IContribution = {
      amount,
      date: new Date(),
      source
    };

    goal.contributions.push(contribution);
    goal.currentAmount += amount;

    // Check milestones
    for (const milestone of goal.milestones) {
      if (!milestone.achieved && goal.currentAmount >= milestone.amount) {
        milestone.achieved = true;
        milestone.achievedDate = new Date();
      }
    }

    // Check if goal completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
      goal.completedAt = new Date();
    }

    await goal.save();
    return goal;
  }

  async getGoalProgress(goalId: string): Promise<GoalProgress> {
    const goal = await FinancialGoal.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    const percentageComplete = (goal.currentAmount / goal.targetAmount) * 100;
    const amountRemaining = goal.targetAmount - goal.currentAmount;
    const daysRemaining = Math.ceil(
      (goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Calculate if on track
    const daysSinceStart = Math.ceil(
      (Date.now() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(
      (goal.targetDate.getTime() - goal.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const expectedPercentage = (daysSinceStart / totalDays) * 100;
    const onTrack = percentageComplete >= expectedPercentage;

    // Project completion date
    const avgDailyContribution = goal.currentAmount / Math.max(daysSinceStart, 1);
    const daysToComplete = amountRemaining / Math.max(avgDailyContribution, 1);
    const projectedCompletionDate = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);

    // Find next milestone
    const nextMilestone = goal.milestones
      .filter(m => !m.achieved)
      .sort((a, b) => a.percentage - b.percentage)[0];

    return {
      goalId: goal._id.toString(),
      name: goal.name,
      percentageComplete,
      amountRemaining,
      daysRemaining,
      onTrack,
      projectedCompletionDate,
      nextMilestone: nextMilestone ? {
        percentage: nextMilestone.percentage,
        amount: nextMilestone.amount,
        targetDate: nextMilestone.targetDate
      } : undefined
    };
  }

  async processRoundUp(
    userId: string,
    transactionAmount: number
  ): Promise<RoundUpResult> {
    const config = await RoundUpConfig.findOne({ userId });
    
    if (!config || !config.enabled) {
      return {
        transactionAmount,
        roundUpAmount: 0,
        totalAmount: transactionAmount,
        goalUpdated: false
      };
    }

    // Calculate round-up amount
    const remainder = transactionAmount % config.roundUpTo;
    let roundUpAmount = remainder > 0 ? config.roundUpTo - remainder : 0;

    // Apply max limit
    if (roundUpAmount > config.maxRoundUpPerTransaction) {
      roundUpAmount = config.maxRoundUpPerTransaction;
    }

    if (roundUpAmount === 0) {
      return {
        transactionAmount,
        roundUpAmount: 0,
        totalAmount: transactionAmount,
        goalUpdated: false
      };
    }

    // Update config stats
    config.totalSaved += roundUpAmount;
    config.transactionCount += 1;
    await config.save();

    // Add to goal if configured
    let goalUpdated = false;
    if (config.destinationGoalId) {
      try {
        await this.addContribution(config.destinationGoalId, roundUpAmount, 'roundup');
        goalUpdated = true;
      } catch (error) {
        console.error('Failed to update goal:', error);
      }
    }

    return {
      transactionAmount,
      roundUpAmount,
      totalAmount: transactionAmount + roundUpAmount,
      goalUpdated
    };
  }

  async configureRoundUp(
    userId: string,
    config: Partial<IRoundUpConfig>
  ): Promise<IRoundUpConfig> {
    let roundUpConfig = await RoundUpConfig.findOne({ userId });

    if (roundUpConfig) {
      Object.assign(roundUpConfig, config);
    } else {
      roundUpConfig = new RoundUpConfig({
        userId,
        ...config,
        totalSaved: 0,
        transactionCount: 0
      });
    }

    await roundUpConfig.save();
    return roundUpConfig;
  }

  async getUserGoals(
    userId: string,
    status?: 'active' | 'completed' | 'paused' | 'cancelled'
  ): Promise<IFinancialGoal[]> {
    const filter: any = { userId };
    if (status) {
      filter.status = status;
    }

    return FinancialGoal.find(filter).sort({ priority: -1, createdAt: -1 });
  }

  async updateGoal(
    goalId: string,
    updates: Partial<IFinancialGoal>
  ): Promise<IFinancialGoal> {
    const goal = await FinancialGoal.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // Prevent updating certain fields
    delete (updates as any).userId;
    delete (updates as any).contributions;
    delete (updates as any).currentAmount;

    Object.assign(goal, updates);
    await goal.save();
    return goal;
  }

  private generateMilestones(
    targetAmount: number,
    startDate: Date,
    targetDate: Date
  ): any[] {
    const milestones = [];
    const percentages = [25, 50, 75, 100];
    const totalDays = (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    for (const percentage of percentages) {
      const amount = (targetAmount * percentage) / 100;
      const daysOffset = (totalDays * percentage) / 100;
      const milestoneDate = new Date(startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);

      milestones.push({
        percentage,
        amount,
        targetDate: milestoneDate,
        achieved: false
      });
    }

    return milestones;
  }
}
