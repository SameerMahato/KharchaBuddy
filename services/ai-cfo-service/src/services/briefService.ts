import { getFinancialSnapshot } from './snapshotService';
import { getUserMemory } from './memoryService';
import { logger } from '../utils/logger';

interface DailyBrief {
  userId: string;
  date: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  alerts: string[];
}

export async function generateDailyBrief(userId: string): Promise<DailyBrief> {
  try {
    const [snapshot, memory] = await Promise.all([
      getFinancialSnapshot(userId),
      getUserMemory(userId),
    ]);

    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];

    // Generate insights
    if (snapshot.totalSpent > 0) {
      insights.push(`You've spent ₹${snapshot.totalSpent} this month across ${snapshot.transactionCount} transactions.`);
    }

    if (snapshot.topCategory !== 'N/A') {
      insights.push(`Your top spending category is ${snapshot.topCategory}.`);
    }

    // Generate recommendations
    if (snapshot.budgetRemaining < 1000) {
      recommendations.push('Your budget is running low. Consider reducing discretionary spending.');
    }

    if (snapshot.savingsRate < 20) {
      recommendations.push('Try to increase your savings rate to at least 20% of your income.');
    }

    // Generate alerts
    if (snapshot.budgetRemaining < 0) {
      alerts.push('⚠️ You are over budget this month!');
    }

    const summary = `Good morning! ${snapshot.budgetRemaining > 0 ? 'You\'re on track with your budget.' : 'Your spending needs attention.'} ${insights[0] || 'Start tracking your expenses today!'}`;

    return {
      userId,
      date: new Date().toISOString().split('T')[0],
      summary,
      insights,
      recommendations,
      alerts,
    };
  } catch (error) {
    logger.error('Failed to generate daily brief', { userId, error });
    throw error;
  }
}
