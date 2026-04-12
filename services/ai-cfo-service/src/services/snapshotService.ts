import { MongoClient } from 'mongodb';
import { logger } from '../utils/logger';

interface FinancialSnapshot {
  totalSpent: number;
  budgetRemaining: number;
  topCategory: string;
  savingsRate: number;
  transactionCount: number;
}

export async function getFinancialSnapshot(userId: string): Promise<FinancialSnapshot> {
  try {
    const client: MongoClient = (global as any).mongoClient;
    const db = client.db('kharchabuddy');
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total spent this month
    const expenses = await db.collection('expenses')
      .find({
        userId,
        date: { $gte: startOfMonth },
      })
      .toArray();

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const transactionCount = expenses.length;

    // Get category breakdown
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    // Get budget
    const budget = await db.collection('budgets').findOne({
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });

    const budgetTotal = budget?.categories?.reduce((sum: number, cat: any) => sum + cat.limit, 0) || 0;
    const budgetRemaining = budgetTotal - totalSpent;

    // Calculate savings rate (simplified)
    const savingsRate = budgetRemaining > 0 ? Math.round((budgetRemaining / budgetTotal) * 100) : 0;

    return {
      totalSpent: Math.round(totalSpent),
      budgetRemaining: Math.round(budgetRemaining),
      topCategory,
      savingsRate,
      transactionCount,
    };
  } catch (error) {
    logger.error('Failed to get financial snapshot', { userId, error });
    return {
      totalSpent: 0,
      budgetRemaining: 0,
      topCategory: 'N/A',
      savingsRate: 0,
      transactionCount: 0,
    };
  }
}
