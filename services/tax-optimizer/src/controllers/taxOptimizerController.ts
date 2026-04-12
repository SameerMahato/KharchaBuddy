import { Request, Response } from 'express';
import { TaxOptimizerService } from '../services/taxOptimizerService';
import { z } from 'zod';
import TaxDeduction from '../models/TaxDeduction';

const analyzeTaxSchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{2}$/),
  estimatedIncome: z.number().positive()
});

const trackDeductionSchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{2}$/),
  section: z.string(),
  category: z.string(),
  amount: z.number().positive(),
  date: z.string().datetime(),
  description: z.string().default(''),
  proofDocument: z.string().optional()
});

const calculateTaxSchema = z.object({
  grossIncome: z.number().positive(),
  deductions: z.number().min(0)
});

export class TaxOptimizerController {
  constructor(private taxOptimizerService: TaxOptimizerService) {}

  analyzeTaxSituation = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { financialYear, estimatedIncome } = analyzeTaxSchema.parse(req.body);

      const analysis = await this.taxOptimizerService.analyzeTaxSituation(
        userId,
        financialYear,
        estimatedIncome
      );

      res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TAX_ANALYSIS_ERROR',
          message: error.message
        }
      });
    }
  };

  optimize80C = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { financialYear } = req.params;

      const optimization = await this.taxOptimizerService.optimize80C(userId, financialYear);

      res.json({
        success: true,
        data: optimization
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: '80C_OPTIMIZATION_ERROR',
          message: error.message
        }
      });
    }
  };

  trackDeduction = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const deductionData = trackDeductionSchema.parse(req.body);

      const deduction = await this.taxOptimizerService.trackDeduction(userId, {
        ...deductionData,
        date: new Date(deductionData.date)
      });

      res.status(201).json({
        success: true,
        data: deduction
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DEDUCTION_TRACKING_ERROR',
          message: error.message
        }
      });
    }
  };

  calculateTaxLiability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { grossIncome, deductions } = calculateTaxSchema.parse(req.body);

      const calculation = await this.taxOptimizerService.calculateTaxLiability(
        grossIncome,
        deductions
      );

      res.json({
        success: true,
        data: calculation
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TAX_CALCULATION_ERROR',
          message: error.message
        }
      });
    }
  };

  getTaxAlerts = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { financialYear } = req.params;

      const alerts = await this.taxOptimizerService.generateTaxAlerts(userId, financialYear);

      res.json({
        success: true,
        data: alerts
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TAX_ALERTS_ERROR',
          message: error.message
        }
      });
    }
  };

  getDeductions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { financialYear, section } = req.query;

      const filter: any = { userId };
      if (financialYear) filter.financialYear = financialYear;
      if (section) filter.section = section;

      const deductions = await TaxDeduction.find(filter).sort({ date: -1 });

      res.json({
        success: true,
        data: deductions
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DEDUCTIONS_FETCH_ERROR',
          message: error.message
        }
      });
    }
  };
}
