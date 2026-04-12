import Loan, { ILoan } from '../models/Loan';
import TrustScore, { ITrustScore, ITrustFactor, ITrustEvent } from '../models/TrustScore';
import { createClient } from 'redis';

interface LoanWithRiskAssessment {
  loan: ILoan;
  riskLevel: 'low' | 'medium' | 'high';
  trustScore: number;
  recommendations: string[];
  suggestedActions: string[];
}

interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

export class SocialFinanceService {
  private redisClient: ReturnType<typeof createClient>;

  constructor(redisClient: ReturnType<typeof createClient>) {
    this.redisClient = redisClient;
  }

  async createLoan(
    userId: string,
    loanData: Partial<ILoan>
  ): Promise<LoanWithRiskAssessment> {
    // Calculate trust score if friendId exists
    let trustScore = 50;
    if (loanData.friendId) {
      const trust = await this.calculateTrustScore(userId, loanData.friendId);
      trustScore = trust.score;
    }

    // Assess lending risk
    const riskAssessment = await this.assessLendingRisk(
      userId,
      loanData.amount || 0,
      loanData.friendId,
      trustScore
    );

    // Create loan
    const loan = new Loan({
      ...loanData,
      userId,
      remainingAmount: loanData.amount,
      trustScoreAtTime: trustScore,
      riskLevel: riskAssessment.riskLevel,
      partialPayments: [],
      remindersSent: []
    });

    await loan.save();

    return {
      loan,
      riskLevel: riskAssessment.riskLevel,
      trustScore,
      recommendations: riskAssessment.recommendations,
      suggestedActions: this.generateSuggestedActions(riskAssessment.riskLevel)
    };
  }

  async recordPartialPayment(
    loanId: string,
    amount: number,
    notes: string = ''
  ): Promise<ILoan> {
    const loan = await Loan.findById(loanId);
    if (!loan) {
      throw new Error('Loan not found');
    }

    // Validate payment amount
    if (amount > loan.remainingAmount) {
      throw new Error('Payment amount exceeds remaining amount');
    }

    // Add partial payment
    loan.partialPayments.push({
      amount,
      date: new Date(),
      notes
    });

    // Update remaining amount
    loan.remainingAmount -= amount;

    // Check if fully paid
    if (loan.remainingAmount <= 0) {
      loan.isPaidBack = true;
      loan.dateReturned = new Date();
      
      // Check if returned on time
      if (loan.expectedReturnDate) {
        loan.isReturnedOnTime = new Date() <= loan.expectedReturnDate;
      }

      // Update trust score
      if (loan.friendId) {
        await this.updateTrustScoreOnPayment(
          loan.userId,
          loan.friendId,
          loan.isReturnedOnTime || false,
          loan.type
        );
      }
    }

    await loan.save();

    // Invalidate trust score cache
    if (loan.friendId) {
      await this.redisClient.del(`trust:${loan.userId}:${loan.friendId}`);
    }

    return loan;
  }

  async calculateTrustScore(
    userId: string,
    friendId: string
  ): Promise<ITrustScore> {
    // Check cache
    const cacheKey = `trust:${userId}:${friendId}`;
    const cached = await this.redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get loan history
    const loans = await Loan.find({
      userId,
      friendId,
      isPaidBack: true
    }).sort({ dateReturned: -1 });

    if (loans.length === 0) {
      // No history, return default score
      const defaultScore: any = {
        userId,
        friendId,
        score: 50,
        factors: [],
        history: [],
        reliability: 'fair',
        lastCalculated: new Date()
      };
      return defaultScore;
    }

    // Calculate factors
    const paymentHistoryScore = this.calculatePaymentHistoryFactor(loans);
    const timelinessScore = this.calculateTimelinessFactor(loans);
    const amountReliabilityScore = this.calculateAmountReliabilityFactor(loans);
    const frequencyScore = this.calculateFrequencyFactor(loans);

    // Weighted score
    const weights = {
      paymentHistory: parseFloat(process.env.PAYMENT_HISTORY_WEIGHT || '0.4'),
      timeliness: parseFloat(process.env.TIMELINESS_WEIGHT || '0.3'),
      amountReliability: parseFloat(process.env.AMOUNT_RELIABILITY_WEIGHT || '0.2'),
      frequency: parseFloat(process.env.FREQUENCY_WEIGHT || '0.1')
    };

    const totalScore = 
      paymentHistoryScore * weights.paymentHistory +
      timelinessScore * weights.timeliness +
      amountReliabilityScore * weights.amountReliability +
      frequencyScore * weights.frequency;

    const factors: ITrustFactor[] = [
      {
        factor: 'Payment History',
        impact: weights.paymentHistory * 100,
        description: `${loans.length} completed transactions`
      },
      {
        factor: 'Timeliness',
        impact: weights.timeliness * 100,
        description: `${this.getOnTimePercentage(loans)}% on-time payments`
      },
      {
        factor: 'Amount Reliability',
        impact: weights.amountReliability * 100,
        description: 'Consistent repayment amounts'
      },
      {
        factor: 'Frequency',
        impact: weights.frequency * 100,
        description: 'Regular transaction history'
      }
    ];

    const reliability = this.getReliabilityRating(totalScore);

    // Save or update trust score
    let trustScore = await TrustScore.findOne({ userId, friendId });
    if (trustScore) {
      trustScore.score = totalScore;
      trustScore.factors = factors;
      trustScore.reliability = reliability;
      trustScore.lastCalculated = new Date();
      trustScore.history.push({
        timestamp: new Date(),
        type: 'recalculation',
        impact: 0
      });
    } else {
      trustScore = new TrustScore({
        userId,
        friendId,
        score: totalScore,
        factors,
        history: [{
          timestamp: new Date(),
          type: 'initial_calculation',
          impact: 0
        }],
        reliability,
        lastCalculated: new Date()
      });
    }

    await trustScore.save();

    // Cache for 24 hours
    await this.redisClient.setEx(
      cacheKey,
      parseInt(process.env.TRUST_SCORE_CACHE_TTL || '86400'),
      JSON.stringify(trustScore)
    );

    return trustScore;
  }

  async assessLendingRisk(
    userId: string,
    amount: number,
    friendId?: string,
    trustScore?: number
  ): Promise<RiskAssessment> {
    const factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    const recommendations: string[] = [];

    // Check trust score
    if (trustScore !== undefined) {
      if (trustScore < 40) {
        factors.push('Low trust score');
        riskLevel = 'high';
        recommendations.push('Consider requesting collateral or reducing amount');
      } else if (trustScore >= 70) {
        factors.push('High trust score');
        riskLevel = 'low';
      }
    }

    // Check amount
    if (amount > 50000) {
      factors.push('Large loan amount');
      if (riskLevel === 'medium') riskLevel = 'high';
      recommendations.push('Set clear repayment terms and schedule');
    }

    // Check previous loans
    if (friendId) {
      const activeLoans = await Loan.find({
        userId,
        friendId,
        isPaidBack: false
      });

      if (activeLoans.length > 0) {
        factors.push('Existing unpaid loans');
        riskLevel = 'high';
        recommendations.push('Resolve existing loans before lending more');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Document the loan agreement');
      recommendations.push('Set a clear repayment date');
    }

    return {
      riskLevel,
      factors,
      recommendations
    };
  }

  async generateReminderMessage(
    loan: ILoan,
    tone: 'friendly' | 'neutral' | 'firm'
  ): Promise<string> {
    const daysOverdue = loan.expectedReturnDate
      ? Math.floor((Date.now() - loan.expectedReturnDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const templates = {
      friendly: {
        onTime: `Hey ${loan.friendName}! Just a friendly reminder about the ₹${loan.remainingAmount} loan. No rush, but wanted to check in! 😊`,
        overdue: `Hi ${loan.friendName}, hope you're doing well! Just wanted to remind you about the ₹${loan.remainingAmount} that's been pending for ${daysOverdue} days. Let me know if you need to work out a payment plan!`
      },
      neutral: {
        onTime: `Hi ${loan.friendName}, this is a reminder about the pending loan of ₹${loan.remainingAmount}. The expected return date is ${loan.expectedReturnDate?.toDateString()}.`,
        overdue: `Hi ${loan.friendName}, the loan of ₹${loan.remainingAmount} is now ${daysOverdue} days overdue. Please arrange for repayment at your earliest convenience.`
      },
      firm: {
        onTime: `${loan.friendName}, this is a reminder that ₹${loan.remainingAmount} is due on ${loan.expectedReturnDate?.toDateString()}. Please ensure timely repayment.`,
        overdue: `${loan.friendName}, your loan of ₹${loan.remainingAmount} is ${daysOverdue} days overdue. Immediate repayment is required. Please contact me to resolve this matter.`
      }
    };

    const isOverdue = daysOverdue > 0;
    return templates[tone][isOverdue ? 'overdue' : 'onTime'];
  }

  async scheduleReminder(loan: ILoan): Promise<void> {
    if (!loan.reminderConfig) return;

    const message = await this.generateReminderMessage(loan, loan.reminderConfig.tone);

    // Log reminder (actual sending would be done by notification service)
    loan.remindersSent.push({
      sentAt: new Date(),
      channel: loan.reminderConfig.channels[0],
      tone: loan.reminderConfig.tone
    });

    await loan.save();
  }

  private calculatePaymentHistoryFactor(loans: ILoan[]): number {
    const paidLoans = loans.filter(l => l.isPaidBack);
    return (paidLoans.length / Math.max(loans.length, 1)) * 100;
  }

  private calculateTimelinessFactor(loans: ILoan[]): number {
    const loansWithDates = loans.filter(l => l.expectedReturnDate && l.isReturnedOnTime !== undefined);
    if (loansWithDates.length === 0) return 50;

    const onTimeLoans = loansWithDates.filter(l => l.isReturnedOnTime);
    return (onTimeLoans.length / loansWithDates.length) * 100;
  }

  private calculateAmountReliabilityFactor(loans: ILoan[]): number {
    if (loans.length < 2) return 50;

    const amounts = loans.map(l => l.amount);
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of variation

    // Lower variation = higher reliability
    return Math.max(0, Math.min(100, 100 - (cv * 100)));
  }

  private calculateFrequencyFactor(loans: ILoan[]): number {
    if (loans.length < 2) return 30;
    if (loans.length >= 5) return 100;

    return (loans.length / 5) * 100;
  }

  private getOnTimePercentage(loans: ILoan[]): number {
    const loansWithDates = loans.filter(l => l.isReturnedOnTime !== undefined);
    if (loansWithDates.length === 0) return 0;

    const onTimeLoans = loansWithDates.filter(l => l.isReturnedOnTime);
    return Math.round((onTimeLoans.length / loansWithDates.length) * 100);
  }

  private getReliabilityRating(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private generateSuggestedActions(riskLevel: 'low' | 'medium' | 'high'): string[] {
    const actions: Record<string, string[]> = {
      low: [
        'Set a clear repayment date',
        'Keep a record of the transaction'
      ],
      medium: [
        'Document the loan agreement',
        'Set up payment reminders',
        'Consider partial payment schedule'
      ],
      high: [
        'Request collateral or guarantor',
        'Create a formal loan agreement',
        'Set up frequent payment reminders',
        'Consider reducing the loan amount'
      ]
    };

    return actions[riskLevel];
  }

  private async updateTrustScoreOnPayment(
    userId: string,
    friendId: string,
    onTime: boolean,
    loanType: 'given' | 'received'
  ): Promise<void> {
    const trustScore = await TrustScore.findOne({ userId, friendId });
    if (!trustScore) return;

    const impact = onTime ? 5 : -10;
    trustScore.score = Math.max(0, Math.min(100, trustScore.score + impact));
    trustScore.history.push({
      timestamp: new Date(),
      type: onTime ? 'on_time_payment' : 'late_payment',
      impact
    });

    await trustScore.save();

    // Invalidate cache
    await this.redisClient.del(`trust:${userId}:${friendId}`);
  }
}
