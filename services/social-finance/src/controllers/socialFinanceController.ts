import { Request, Response } from 'express';
import { SocialFinanceService } from '../services/socialFinanceService';
import { z } from 'zod';
import Loan from '../models/Loan';

const createLoanSchema = z.object({
  friendId: z.string().optional(),
  friendName: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  type: z.enum(['given', 'received']),
  expectedReturnDate: z.string().datetime().optional(),
  description: z.string().default(''),
  notes: z.string().default(''),
  reminderConfig: z.object({
    frequency: z.enum(['daily', 'weekly', 'biweekly']),
    tone: z.enum(['friendly', 'neutral', 'firm']),
    escalation: z.boolean().default(false),
    channels: z.array(z.enum(['sms', 'email', 'push']))
  }).optional()
});

const partialPaymentSchema = z.object({
  amount: z.number().positive(),
  notes: z.string().default('')
});

export class SocialFinanceController {
  constructor(private socialFinanceService: SocialFinanceService) {}

  createLoan = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const loanData = createLoanSchema.parse(req.body);

      const result = await this.socialFinanceService.createLoan(userId, {
        ...loanData,
        expectedReturnDate: loanData.expectedReturnDate ? new Date(loanData.expectedReturnDate) : undefined
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'LOAN_CREATION_ERROR',
          message: error.message
        }
      });
    }
  };

  recordPartialPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId } = req.params;
      const { amount, notes } = partialPaymentSchema.parse(req.body);

      const loan = await this.socialFinanceService.recordPartialPayment(loanId, amount, notes);

      res.json({
        success: true,
        data: loan
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_RECORDING_ERROR',
          message: error.message
        }
      });
    }
  };

  getTrustScore = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { friendId } = req.params;

      const trustScore = await this.socialFinanceService.calculateTrustScore(userId, friendId);

      res.json({
        success: true,
        data: trustScore
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TRUST_SCORE_ERROR',
          message: error.message
        }
      });
    }
  };

  getLoans = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { type, isPaidBack } = req.query;

      const filter: any = { userId };
      if (type) filter.type = type;
      if (isPaidBack !== undefined) filter.isPaidBack = isPaidBack === 'true';

      const loans = await Loan.find(filter).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: loans
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'LOAN_FETCH_ERROR',
          message: error.message
        }
      });
    }
  };

  getLoanById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { loanId } = req.params;
      const loan = await Loan.findById(loanId);

      if (!loan) {
        res.status(404).json({
          success: false,
          error: {
            code: 'LOAN_NOT_FOUND',
            message: 'Loan not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: loan
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'LOAN_FETCH_ERROR',
          message: error.message
        }
      });
    }
  };
}
