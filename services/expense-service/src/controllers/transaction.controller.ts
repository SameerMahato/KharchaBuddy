import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { RawTransaction } from '@kharchabuddy/shared';
import { z } from 'zod';
import { ValidationError } from '@kharchabuddy/shared';

// Validation schemas
const createTransactionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional().default('INR'),
  merchant: z.string().optional(),
  timestamp: z.string().datetime().or(z.date()),
  source: z.enum(['manual', 'bank_api', 'upi', 'sms', 'email']),
  sourceId: z.string().optional(),
  rawText: z.string().optional(),
});

const getTransactionsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  category: z.string().optional(),
  type: z.enum(['expense', 'income']).optional(),
  minAmount: z.string().transform(Number).optional(),
  maxAmount: z.string().transform(Number).optional(),
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('20'),
});

export class TransactionController {
  /**
   * Create a new transaction
   */
  async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const validatedData = createTransactionSchema.parse(req.body);

      const rawTransaction: RawTransaction = {
        amount: validatedData.amount,
        currency: validatedData.currency,
        merchant: validatedData.merchant,
        timestamp: new Date(validatedData.timestamp),
        source: validatedData.source,
        sourceId: validatedData.sourceId,
        rawText: validatedData.rawText,
      };

      const transaction = await transactionService.processTransaction(userId, rawTransaction);

      res.status(201).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transactions with filtering and pagination
   */
  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const validatedQuery = getTransactionsSchema.parse(req.query);

      const filters = {
        startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
        endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
        category: validatedQuery.category,
        type: validatedQuery.type,
        minAmount: validatedQuery.minAmount,
        maxAmount: validatedQuery.maxAmount,
      };

      const pagination = {
        page: validatedQuery.page,
        pageSize: Math.min(validatedQuery.pageSize, 100), // Max 100 per page
      };

      const result = await transactionService.getTransactions(userId, filters, pagination);

      res.json({
        success: true,
        data: result.transactions,
        metadata: {
          total: result.total,
          page: pagination.page,
          pageSize: pagination.pageSize,
          hasMore: result.hasMore,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single transaction by ID
   */
  async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(userId, id);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Transaction not found' },
        });
        return;
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a transaction
   */
  async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const { id } = req.params;
      const updates = req.body;

      const transaction = await transactionService.updateTransaction(userId, id, updates);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Transaction not found' },
        });
        return;
      }

      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const { id } = req.params;
      const deleted = await transactionService.deleteTransaction(userId, id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Transaction not found' },
        });
        return;
      }

      res.json({
        success: true,
        data: { deleted: true },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get spending by category
   */
  async getSpendingByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID is required');
      }

      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        throw new ValidationError('startDate and endDate are required');
      }

      const result = await transactionService.getSpendingByCategory(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
