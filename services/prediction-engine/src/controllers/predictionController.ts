import { Request, Response } from 'express';
import { PredictionService } from '../services/predictionService';
import { z } from 'zod';

const predictExpensesSchema = z.object({
  category: z.string().optional(),
  horizon: z.number().int().min(1).max(90).default(30)
});

const forecastCashFlowSchema = z.object({
  days: z.number().int().min(1).max(90).default(30),
  currentBalance: z.number()
});

export class PredictionController {
  constructor(private predictionService: PredictionService) {}

  predictExpenses = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { category, horizon } = predictExpensesSchema.parse(req.query);

      const predictions = await this.predictionService.predictNextExpenses(
        userId,
        category,
        horizon
      );

      res.json({
        success: true,
        data: predictions,
        metadata: {
          userId,
          category: category || 'all',
          horizon,
          count: predictions.length
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PREDICTION_ERROR',
          message: error.message
        }
      });
    }
  };

  forecastCashFlow = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { days, currentBalance } = forecastCashFlowSchema.parse(req.body);

      const forecast = await this.predictionService.forecastCashFlow(
        userId,
        days,
        currentBalance
      );

      res.json({
        success: true,
        data: forecast,
        metadata: {
          userId,
          days,
          currentBalance,
          confidence: forecast.confidence
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FORECAST_ERROR',
          message: error.message
        }
      });
    }
  };

  getRecurringTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;

      const recurring = await this.predictionService.detectRecurringTransactions(userId);

      res.json({
        success: true,
        data: recurring,
        metadata: {
          userId,
          count: recurring.length
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'RECURRING_DETECTION_ERROR',
          message: error.message
        }
      });
    }
  };
}
