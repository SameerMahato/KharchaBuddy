import { Request, Response, NextFunction } from 'express';
import { categorizationService } from '../services/categorization.service';
import { z } from 'zod';
import { ValidationError } from '@kharchabuddy/shared';

const categorizationRequestSchema = z.object({
  merchantOrDescription: z.string().min(1),
  amount: z.number().positive(),
});

const feedbackSchema = z.object({
  merchantOrDescription: z.string().min(1),
  correctCategory: z.string().min(1),
});

export class CategoryController {
  /**
   * Get all available categories
   */
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = categorizationService.getCategories();

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Categorize a transaction
   */
  async categorize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = categorizationRequestSchema.parse(req.body);

      const result = await categorizationService.categorizeTransaction(
        validatedData.merchantOrDescription,
        validatedData.amount
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit feedback for categorization
   */
  async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = feedbackSchema.parse(req.body);

      await categorizationService.updateModelWithFeedback(
        validatedData.merchantOrDescription,
        validatedData.correctCategory
      );

      res.json({
        success: true,
        data: { message: 'Feedback received' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
