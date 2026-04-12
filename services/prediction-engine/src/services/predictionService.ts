import PredictionModel from '../models/PredictionModel';
import { TimeSeriesDataStore } from '../models/TimeSeriesData';
import { createClient } from 'redis';

interface ExpensePrediction {
  category: string;
  amount: number;
  probability: number;
  expectedDate: Date;
  reasoning: string;
}

interface CashFlowForecast {
  predictions: DailyPrediction[];
  confidence: number;
  factors: ForecastFactor[];
  warnings: Warning[];
}

interface DailyPrediction {
  date: Date;
  expectedIncome: number;
  expectedExpenses: number;
  netCashFlow: number;
  balance: number;
  confidenceInterval: [number, number];
}

interface ForecastFactor {
  name: string;
  impact: number;
}

interface Warning {
  date: Date;
  type: 'negative_balance' | 'low_balance';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface RecurringTransaction {
  category: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export class PredictionService {
  private timeSeriesStore: TimeSeriesDataStore;
  private redisClient: ReturnType<typeof createClient>;

  constructor(timeSeriesStore: TimeSeriesDataStore, redisClient: ReturnType<typeof createClient>) {
    this.timeSeriesStore = timeSeriesStore;
    this.redisClient = redisClient;
  }

  async predictNextExpenses(
    userId: string,
    category?: string,
    horizon: number = 30
  ): Promise<ExpensePrediction[]> {
    // Check cache
    const cacheKey = `predictions:${userId}:${category || 'all'}:${horizon}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get historical data
    const historicalData = await this.timeSeriesStore.getHistoricalData(userId, category, 1000);
    
    if (historicalData.length < 30) {
      return [];
    }

    // Extract features
    const features = this.extractTimeSeriesFeatures(historicalData);
    
    // Get or train model
    let model = await PredictionModel.findOne({ 
      userId, 
      category: category || null 
    }).sort({ lastTrainedAt: -1 });

    if (!model || this.isModelStale(model)) {
      model = await this.trainPredictionModel(userId, historicalData, category);
    }

    // Generate predictions
    const predictions: ExpensePrediction[] = [];
    const today = new Date();

    for (let day = 1; day <= horizon; day++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + day);

      const dayFeatures = {
        dayOfWeek: targetDate.getDay(),
        dayOfMonth: targetDate.getDate(),
        month: targetDate.getMonth(),
        isWeekend: targetDate.getDay() === 0 || targetDate.getDay() === 6,
        isMonthStart: targetDate.getDate() <= 5,
        isMonthEnd: targetDate.getDate() >= 25,
        ...features
      };

      const prediction = this.predictForDay(dayFeatures, features);

      if (prediction.probability > 0.3) {
        predictions.push({
          category: category || prediction.category,
          amount: prediction.amount,
          probability: prediction.probability,
          expectedDate: targetDate,
          reasoning: this.generatePredictionReasoning(prediction, dayFeatures)
        });
      }
    }

    const sortedPredictions = predictions
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 20);

    // Cache results
    await this.redisClient.setEx(cacheKey, 3600, JSON.stringify(sortedPredictions));

    return sortedPredictions;
  }

  async forecastCashFlow(
    userId: string,
    days: number,
    currentBalance: number
  ): Promise<CashFlowForecast> {
    // Check cache
    const cacheKey = `cashflow:${userId}:${days}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const historicalData = await this.timeSeriesStore.getHistoricalData(userId, undefined, 1000);
    
    if (historicalData.length < 30) {
      throw new Error('Insufficient historical data for cash flow forecasting');
    }

    // Identify recurring transactions
    const recurringTransactions = this.identifyRecurringTransactions(historicalData);

    // Build statistical models
    const incomeData = historicalData.filter(tx => tx.type === 'income');
    const expenseData = historicalData.filter(tx => tx.type === 'expense');

    const incomeModel = this.buildDistributionModel(incomeData);
    const expenseModel = this.buildDistributionModel(expenseData);

    // Run Monte Carlo simulation
    const numSimulations = parseInt(process.env.MONTE_CARLO_ITERATIONS || '1000');
    const simulations: DailyPrediction[][] = [];

    for (let sim = 0; sim < numSimulations; sim++) {
      const simulation: DailyPrediction[] = [];
      let balance = currentBalance;

      for (let day = 1; day <= days; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);

        // Predict income
        let expectedIncome = 0;
        const recurringIncome = recurringTransactions.income.filter(tx =>
          this.isScheduledForDate(tx, date)
        );
        expectedIncome += recurringIncome.reduce((sum, tx) => sum + tx.amount, 0);
        expectedIncome += this.sampleFromDistribution(incomeModel);

        // Predict expenses
        let expectedExpenses = 0;
        const recurringExpenses = recurringTransactions.expenses.filter(tx =>
          this.isScheduledForDate(tx, date)
        );
        expectedExpenses += recurringExpenses.reduce((sum, tx) => sum + tx.amount, 0);
        expectedExpenses += this.sampleFromDistribution(expenseModel);

        const netCashFlow = expectedIncome - expectedExpenses;
        balance += netCashFlow;

        simulation.push({
          date,
          expectedIncome,
          expectedExpenses,
          netCashFlow,
          balance,
          confidenceInterval: [0, 0]
        });
      }

      simulations.push(simulation);
    }

    // Aggregate simulations
    const predictions: DailyPrediction[] = [];
    for (let day = 0; day < days; day++) {
      const daySimulations = simulations.map(sim => sim[day]);
      const balances = daySimulations.map(d => d.balance).sort((a, b) => a - b);
      const p5 = balances[Math.floor(balances.length * 0.05)];
      const p95 = balances[Math.floor(balances.length * 0.95)];

      predictions.push({
        date: daySimulations[0].date,
        expectedIncome: this.calculateMean(daySimulations.map(d => d.expectedIncome)),
        expectedExpenses: this.calculateMean(daySimulations.map(d => d.expectedExpenses)),
        netCashFlow: this.calculateMean(daySimulations.map(d => d.netCashFlow)),
        balance: this.calculateMean(daySimulations.map(d => d.balance)),
        confidenceInterval: [p5, p95]
      });
    }

    // Generate warnings
    const warnings: Warning[] = [];
    for (const prediction of predictions) {
      if (prediction.balance < 0) {
        warnings.push({
          date: prediction.date,
          type: 'negative_balance',
          severity: 'high',
          message: `Predicted negative balance of ₹${Math.abs(prediction.balance).toFixed(2)}`
        });
      } else if (prediction.balance < currentBalance * 0.2) {
        warnings.push({
          date: prediction.date,
          type: 'low_balance',
          severity: 'medium',
          message: `Balance may drop to ₹${prediction.balance.toFixed(2)}`
        });
      }
    }

    // Calculate factors
    const factors: ForecastFactor[] = [
      { name: 'Recurring Income', impact: incomeModel.recurringPercentage },
      { name: 'Recurring Expenses', impact: expenseModel.recurringPercentage },
      { name: 'Variable Expenses', impact: expenseModel.variability },
      { name: 'Historical Patterns', impact: 0.7 }
    ];

    const confidence = this.calculateForecastConfidence(
      historicalData.length,
      expenseModel.variability,
      days
    );

    const forecast: CashFlowForecast = {
      predictions,
      confidence,
      factors,
      warnings
    };

    // Cache results
    await this.redisClient.setEx(cacheKey, 3600, JSON.stringify(forecast));

    return forecast;
  }

  async detectRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
    const historicalData = await this.timeSeriesStore.getHistoricalData(userId, undefined, 1000);
    return this.identifyRecurringTransactions(historicalData).expenses.concat(
      this.identifyRecurringTransactions(historicalData).income
    );
  }

  private extractTimeSeriesFeatures(data: any[]): any {
    const amounts = data.map(tx => tx.amount);
    const dates = data.map(tx => new Date(tx.timestamp));

    return {
      mean: this.calculateMean(amounts),
      median: this.calculateMedian(amounts),
      stdDev: this.calculateStdDev(amounts),
      frequency: this.calculateFrequency(dates),
      lastAmount: amounts[0],
      avgDaysBetween: this.calculateAvgDaysBetween(dates)
    };
  }

  private async trainPredictionModel(userId: string, data: any[], category?: string): Promise<any> {
    // Simplified model training - in production, use actual ML library
    const features = this.extractTimeSeriesFeatures(data);
    
    const model = new PredictionModel({
      userId,
      modelVersion: '1.0.0',
      category,
      parameters: {
        algorithm: 'simple_average',
        hyperparameters: {},
        features: ['mean', 'median', 'stdDev', 'frequency']
      },
      trainingDataSize: data.length,
      lastTrainedAt: new Date(),
      accuracy: 0.75,
      mae: features.stdDev * 0.5,
      rmse: features.stdDev * 0.7,
      featureImportance: [
        { feature: 'mean', importance: 0.4, description: 'Average transaction amount' },
        { feature: 'frequency', importance: 0.3, description: 'Transaction frequency' },
        { feature: 'stdDev', importance: 0.2, description: 'Amount variability' },
        { feature: 'dayOfWeek', importance: 0.1, description: 'Day of week pattern' }
      ],
      cachedPredictions: []
    });

    await model.save();
    return model;
  }

  private isModelStale(model: any): boolean {
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - model.lastTrainedAt.getTime() > weekInMs;
  }

  private predictForDay(dayFeatures: any, historicalFeatures: any): any {
    // Simplified prediction - in production, use trained ML model
    let amount = historicalFeatures.mean;
    let probability = 0.5;

    // Adjust based on day features
    if (dayFeatures.isWeekend) {
      amount *= 1.2;
      probability *= 0.8;
    }
    if (dayFeatures.isMonthStart || dayFeatures.isMonthEnd) {
      amount *= 1.3;
      probability *= 1.1;
    }

    return {
      amount: Math.max(0, amount + (Math.random() - 0.5) * historicalFeatures.stdDev),
      probability: Math.min(1, probability),
      category: 'general'
    };
  }

  private generatePredictionReasoning(prediction: any, features: any): string {
    const reasons: string[] = [];
    
    if (features.isWeekend) {
      reasons.push('weekend spending pattern');
    }
    if (features.isMonthStart) {
      reasons.push('beginning of month');
    }
    if (features.isMonthEnd) {
      reasons.push('end of month bills');
    }

    return reasons.length > 0 
      ? `Based on ${reasons.join(', ')}`
      : 'Based on historical spending patterns';
  }

  private identifyRecurringTransactions(data: any[]): { income: RecurringTransaction[], expenses: RecurringTransaction[] } {
    // Simplified recurring detection
    const categoryGroups = new Map<string, any[]>();
    
    for (const tx of data) {
      const key = `${tx.type}:${tx.category}`;
      if (!categoryGroups.has(key)) {
        categoryGroups.set(key, []);
      }
      categoryGroups.get(key)!.push(tx);
    }

    const recurring: { income: RecurringTransaction[], expenses: RecurringTransaction[] } = {
      income: [],
      expenses: []
    };

    for (const [key, txs] of categoryGroups) {
      if (txs.length >= 3) {
        const [type, category] = key.split(':');
        const amounts = txs.map(tx => tx.amount);
        const avgAmount = this.calculateMean(amounts);
        const stdDev = this.calculateStdDev(amounts);

        // If amounts are consistent (low variance), it's likely recurring
        if (stdDev / avgAmount < 0.2) {
          const transaction: RecurringTransaction = {
            category,
            amount: avgAmount,
            frequency: 'monthly'
          };

          if (type === 'income') {
            recurring.income.push(transaction);
          } else {
            recurring.expenses.push(transaction);
          }
        }
      }
    }

    return recurring;
  }

  private buildDistributionModel(data: any[]): any {
    const amounts = data.map(tx => tx.amount);
    return {
      mean: this.calculateMean(amounts),
      stdDev: this.calculateStdDev(amounts),
      recurringPercentage: 0.6,
      variability: this.calculateStdDev(amounts) / this.calculateMean(amounts)
    };
  }

  private isScheduledForDate(tx: RecurringTransaction, date: Date): boolean {
    if (tx.frequency === 'monthly' && tx.dayOfMonth) {
      return date.getDate() === tx.dayOfMonth;
    }
    if (tx.frequency === 'weekly' && tx.dayOfWeek !== undefined) {
      return date.getDay() === tx.dayOfWeek;
    }
    return false;
  }

  private sampleFromDistribution(model: any): number {
    // Simple normal distribution sampling
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, model.mean + z * model.stdDev);
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateStdDev(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(this.calculateMean(squaredDiffs));
  }

  private calculateFrequency(dates: Date[]): number {
    if (dates.length < 2) return 0;
    const daysBetween = this.calculateAvgDaysBetween(dates);
    return daysBetween > 0 ? 30 / daysBetween : 0;
  }

  private calculateAvgDaysBetween(dates: Date[]): number {
    if (dates.length < 2) return 0;
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    let totalDays = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalDays += (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    }
    return totalDays / (sorted.length - 1);
  }

  private calculateForecastConfidence(dataPoints: number, variability: number, horizon: number): number {
    let confidence = 0.9;
    
    if (dataPoints < 60) confidence -= 0.2;
    if (variability > 0.5) confidence -= 0.15;
    if (horizon > 60) confidence -= 0.1;
    
    return Math.max(0.3, Math.min(1, confidence));
  }
}
