import { Request, Response } from 'express';
import { WealthBuilderService } from '../services/wealthBuilderService';
import { z } from 'zod';

const createGoalSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['savings', 'investment', 'debt_payoff', 'purchase', 'retirement']),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  currency: z.string().default('INR'),
  startDate: z.string().datetime(),
  targetDate: z.string().datetime(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  autoContribute: z.boolean().default(false),
  monthlyContribution: z.number().positive().optional()
});

const addContributionSchema = z.object({
  amount: z.number().positive(),
  source: z.enum(['manual', 'auto', 'roundup']).default('manual')
});

const configureRoundUpSchema = z.object({
  enabled: z.boolean(),
  roundUpTo: z.number().positive().default(10),
  maxRoundUpPerTransaction: z.number().positive().default(50),
  destinationGoalId: z.string().optional()
});

export class WealthBuilderController {
  constructor(private wealthBuilderService: WealthBuilderService) {}

  createGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const goalData = createGoalSchema.parse(req.body);

      const goal = await this.wealthBuilderService.createGoal(userId, {
        ...goalData,
        startDate: new Date(goalData.startDate),
        targetDate: new Date(goalData.targetDate)
      });

      res.status(201).json({
        success: true,
        data: goal
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GOAL_CREATION_ERROR',
          message: error.message
        }
      });
    }
  };

  addContribution = async (req: Request, res: Response): Promise<void> => {
    try {
      const { goalId } = req.params;
      const { amount, source } = addContributionSchema.parse(req.body);

      const goal = await this.wealthBuilderService.addContribution(goalId, amount, source);

      res.json({
        success: true,
        data: goal
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CONTRIBUTION_ERROR',
          message: error.message
        }
      });
    }
  };

  getGoalProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { goalId } = req.params;
      const progress = await this.wealthBuilderService.getGoalProgress(goalId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PROGRESS_ERROR',
          message: error.message
        }
      });
    }
  };

  processRoundUp = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { transactionAmount } = req.body;

      const result = await this.wealthBuilderService.processRoundUp(userId, transactionAmount);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ROUNDUP_ERROR',
          message: error.message
        }
      });
    }
  };

  configureRoundUp = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const config = configureRoundUpSchema.parse(req.body);

      const result = await this.wealthBuilderService.configureRoundUp(userId, config);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: error.message
        }
      });
    }
  };

  getUserGoals = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { status } = req.query;

      const goals = await this.wealthBuilderService.getUserGoals(
        userId,
        status as any
      );

      res.json({
        success: true,
        data: goals
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'GOALS_FETCH_ERROR',
          message: error.message
        }
      });
    }
  };
}
