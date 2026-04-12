import TaxDeduction, { ITaxDeduction } from '../models/TaxDeduction';

interface TaxAnalysis {
  financialYear: string;
  estimatedIncome: number;
  currentDeductions: DeductionSummary[];
  potentialSavings: number;
  recommendations: TaxRecommendation[];
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
}

interface DeductionSummary {
  section: string;
  utilized: number;
  limit: number;
  remaining: number;
}

interface TaxRecommendation {
  section: string;
  suggestion: string;
  potentialSaving: number;
  deadline?: Date;
  priority: 'high' | 'medium' | 'low';
}

interface Section80COptimization {
  totalLimit: number;
  utilized: number;
  remaining: number;
  suggestions: Investment80C[];
  deadline: Date;
}

interface Investment80C {
  instrument: string;
  amount: number;
  taxSaving: number;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

interface TaxCalculation {
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxLiability: number;
  effectiveTaxRate: number;
  breakdown: TaxSlabBreakdown[];
}

interface TaxSlabBreakdown {
  slab: string;
  income: number;
  rate: number;
  tax: number;
}

export class TaxOptimizerService {
  private readonly SECTION_80C_LIMIT = parseInt(process.env.SECTION_80C_LIMIT || '150000');
  private readonly SECTION_80D_LIMIT = parseInt(process.env.SECTION_80D_LIMIT || '25000');
  private readonly SECTION_24B_LIMIT = parseInt(process.env.SECTION_24B_LIMIT || '200000');

  async analyzeTaxSituation(
    userId: string,
    financialYear: string,
    estimatedIncome: number
  ): Promise<TaxAnalysis> {
    // Get all deductions for the financial year
    const deductions = await TaxDeduction.find({ userId, financialYear });

    // Calculate deduction summaries
    const deductionSummaries = this.calculateDeductionSummaries(deductions);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      deductionSummaries,
      estimatedIncome,
      financialYear
    );

    // Calculate potential savings
    const potentialSavings = recommendations.reduce(
      (sum, rec) => sum + rec.potentialSaving,
      0
    );

    // Determine compliance status
    const complianceStatus = this.determineComplianceStatus(
      deductionSummaries,
      financialYear
    );

    return {
      financialYear,
      estimatedIncome,
      currentDeductions: deductionSummaries,
      potentialSavings,
      recommendations,
      complianceStatus
    };
  }

  async optimize80C(userId: string, financialYear: string): Promise<Section80COptimization> {
    const deductions = await TaxDeduction.find({
      userId,
      financialYear,
      section: '80C'
    });

    const utilized = deductions.reduce((sum, d) => sum + d.amount, 0);
    const remaining = Math.max(0, this.SECTION_80C_LIMIT - utilized);

    const suggestions = this.generate80CSuggestions(remaining);

    // Financial year ends on March 31
    const [startYear] = financialYear.split('-');
    const deadline = new Date(`${parseInt(startYear) + 1}-03-31`);

    return {
      totalLimit: this.SECTION_80C_LIMIT,
      utilized,
      remaining,
      suggestions,
      deadline
    };
  }

  async trackDeduction(
    userId: string,
    deductionData: Partial<ITaxDeduction>
  ): Promise<ITaxDeduction> {
    // Validate section limits
    if (deductionData.section && deductionData.amount) {
      await this.validateDeductionLimit(
        userId,
        deductionData.financialYear || '',
        deductionData.section,
        deductionData.amount
      );
    }

    const deduction = new TaxDeduction({
      ...deductionData,
      userId
    });

    await deduction.save();
    return deduction;
  }

  async calculateTaxLiability(
    grossIncome: number,
    deductions: number
  ): Promise<TaxCalculation> {
    const taxableIncome = Math.max(0, grossIncome - deductions);

    // Indian tax slabs for FY 2024-25 (New Regime)
    const taxSlabs = [
      { limit: 300000, rate: 0 },
      { limit: 700000, rate: 0.05 },
      { limit: 1000000, rate: 0.10 },
      { limit: 1200000, rate: 0.15 },
      { limit: 1500000, rate: 0.20 },
      { limit: Infinity, rate: 0.30 }
    ];

    let taxLiability = 0;
    const breakdown: TaxSlabBreakdown[] = [];
    let remainingIncome = taxableIncome;
    let previousLimit = 0;

    for (const slab of taxSlabs) {
      if (remainingIncome <= 0) break;

      const slabIncome = Math.min(remainingIncome, slab.limit - previousLimit);
      const slabTax = slabIncome * slab.rate;
      taxLiability += slabTax;

      if (slabIncome > 0) {
        breakdown.push({
          slab: `₹${previousLimit.toLocaleString('en-IN')} - ₹${slab.limit === Infinity ? 'Above' : slab.limit.toLocaleString('en-IN')}`,
          income: slabIncome,
          rate: slab.rate,
          tax: slabTax
        });
      }

      remainingIncome -= slabIncome;
      previousLimit = slab.limit;
    }

    // Add 4% cess
    taxLiability *= 1.04;

    const effectiveTaxRate = grossIncome > 0 ? (taxLiability / grossIncome) * 100 : 0;

    return {
      grossIncome,
      totalDeductions: deductions,
      taxableIncome,
      taxLiability,
      effectiveTaxRate,
      breakdown
    };
  }

  async generateTaxAlerts(userId: string, financialYear: string): Promise<TaxRecommendation[]> {
    const [startYear] = financialYear.split('-');
    const deadline = new Date(`${parseInt(startYear) + 1}-03-31`);
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const alerts: TaxRecommendation[] = [];

    if (daysUntilDeadline <= 30 && daysUntilDeadline > 0) {
      const section80C = await this.optimize80C(userId, financialYear);
      
      if (section80C.remaining > 0) {
        alerts.push({
          section: '80C',
          suggestion: `You have ₹${section80C.remaining.toLocaleString('en-IN')} remaining in Section 80C. Invest before March 31 to save taxes.`,
          potentialSaving: section80C.remaining * 0.3,
          deadline,
          priority: 'high'
        });
      }
    }

    return alerts;
  }

  private calculateDeductionSummaries(deductions: ITaxDeduction[]): DeductionSummary[] {
    const summaries: Map<string, DeductionSummary> = new Map();

    // Initialize with limits
    summaries.set('80C', {
      section: '80C',
      utilized: 0,
      limit: this.SECTION_80C_LIMIT,
      remaining: this.SECTION_80C_LIMIT
    });
    summaries.set('80D', {
      section: '80D',
      utilized: 0,
      limit: this.SECTION_80D_LIMIT,
      remaining: this.SECTION_80D_LIMIT
    });
    summaries.set('24B', {
      section: '24B',
      utilized: 0,
      limit: this.SECTION_24B_LIMIT,
      remaining: this.SECTION_24B_LIMIT
    });

    // Calculate utilized amounts
    for (const deduction of deductions) {
      const summary = summaries.get(deduction.section);
      if (summary) {
        summary.utilized += deduction.amount;
        summary.remaining = Math.max(0, summary.limit - summary.utilized);
      }
    }

    return Array.from(summaries.values());
  }

  private generateRecommendations(
    deductionSummaries: DeductionSummary[],
    estimatedIncome: number,
    financialYear: string
  ): TaxRecommendation[] {
    const recommendations: TaxRecommendation[] = [];
    const [startYear] = financialYear.split('-');
    const deadline = new Date(`${parseInt(startYear) + 1}-03-31`);

    for (const summary of deductionSummaries) {
      if (summary.remaining > 0) {
        const potentialSaving = summary.remaining * 0.3; // Assuming 30% tax bracket

        let suggestion = '';
        let priority: 'high' | 'medium' | 'low' = 'medium';

        switch (summary.section) {
          case '80C':
            suggestion = `Invest ₹${summary.remaining.toLocaleString('en-IN')} in ELSS, PPF, or EPF to maximize Section 80C benefits`;
            priority = summary.remaining > 50000 ? 'high' : 'medium';
            break;
          case '80D':
            suggestion = `Purchase health insurance worth ₹${summary.remaining.toLocaleString('en-IN')} to claim Section 80D deduction`;
            priority = 'medium';
            break;
          case '24B':
            suggestion = `Home loan interest of up to ₹${summary.remaining.toLocaleString('en-IN')} can be claimed under Section 24B`;
            priority = 'low';
            break;
        }

        recommendations.push({
          section: summary.section,
          suggestion,
          potentialSaving,
          deadline,
          priority
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private generate80CSuggestions(remaining: number): Investment80C[] {
    if (remaining <= 0) return [];

    const suggestions: Investment80C[] = [
      {
        instrument: 'ELSS Mutual Funds',
        amount: Math.min(remaining, 50000),
        taxSaving: Math.min(remaining, 50000) * 0.3,
        riskLevel: 'medium',
        description: '3-year lock-in, potential for high returns'
      },
      {
        instrument: 'Public Provident Fund (PPF)',
        amount: Math.min(remaining, 150000),
        taxSaving: Math.min(remaining, 150000) * 0.3,
        riskLevel: 'low',
        description: '15-year lock-in, government-backed, 7-7.5% returns'
      },
      {
        instrument: 'National Savings Certificate (NSC)',
        amount: Math.min(remaining, 100000),
        taxSaving: Math.min(remaining, 100000) * 0.3,
        riskLevel: 'low',
        description: '5-year lock-in, fixed returns around 7%'
      },
      {
        instrument: 'Employee Provident Fund (EPF)',
        amount: Math.min(remaining, 150000),
        taxSaving: Math.min(remaining, 150000) * 0.3,
        riskLevel: 'low',
        description: 'Retirement savings, employer contribution'
      }
    ];

    return suggestions.filter(s => s.amount > 0);
  }

  private determineComplianceStatus(
    deductionSummaries: DeductionSummary[],
    financialYear: string
  ): 'compliant' | 'at_risk' | 'non_compliant' {
    const [startYear] = financialYear.split('-');
    const deadline = new Date(`${parseInt(startYear) + 1}-03-31`);
    const daysUntilDeadline = Math.ceil(
      (deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Check if any section is over-utilized
    const overUtilized = deductionSummaries.some(s => s.utilized > s.limit);
    if (overUtilized) {
      return 'non_compliant';
    }

    // Check if deadline is approaching with unused deductions
    const hasUnusedDeductions = deductionSummaries.some(s => s.remaining > s.limit * 0.5);
    if (daysUntilDeadline <= 30 && hasUnusedDeductions) {
      return 'at_risk';
    }

    return 'compliant';
  }

  private async validateDeductionLimit(
    userId: string,
    financialYear: string,
    section: string,
    amount: number
  ): Promise<void> {
    const existingDeductions = await TaxDeduction.find({
      userId,
      financialYear,
      section
    });

    const totalUtilized = existingDeductions.reduce((sum, d) => sum + d.amount, 0) + amount;

    let limit = 0;
    switch (section) {
      case '80C':
        limit = this.SECTION_80C_LIMIT;
        break;
      case '80D':
        limit = this.SECTION_80D_LIMIT;
        break;
      case '24B':
        limit = this.SECTION_24B_LIMIT;
        break;
    }

    if (totalUtilized > limit) {
      throw new Error(
        `Deduction amount exceeds Section ${section} limit of ₹${limit.toLocaleString('en-IN')}`
      );
    }
  }
}
