import { Transaction } from '../../../../shared/types';
import { AnomalyResult, SpendingBaseline } from '../../../../shared/types';
import { redisClient } from '../config/redis';
import { logger } from '@kharchabuddy/shared';
import { transactionModel } from '../models/transaction.model';

interface AnomalyDetectionConfig {
  baselineDays: number;
  stdDevThreshold: number;
  duplicateWindowMinutes: number;
  unusualTimeStart: number; // Hour (0-23)
  unusualTimeEnd: number;   // Hour (0-23)
}

const config: AnomalyDetectionConfig = {
  baselineDays: 7,
  stdDevThreshold: 3,
  duplicateWindowMinutes: 5,
  unusualTimeStart: 0,  // Midnight
  unusualTimeEnd: 6     // 6 AM
};

class AnomalyDetectionService {
  
  /**
   * Main anomaly detection function - runs all detection layers
   */
  async detectAnomaly(userId: string, transaction: Transaction): Promise<AnomalyResult> {
    try {
      // Get or establish spending baseline
      const baseline = await this.getSpendingBaseline(userId);
      
      if (!baseline.isEstablished) {
        return {
          isAnomaly: false,
          anomalyType: 'unusual_amount',
          severity: 'low',
          explanation: 'Insufficient data to establish baseline (requires 7 days)',
          suggestedAction: 'Continue monitoring'
        };
      }

      // Run all detection layers
      const detections = await Promise.all([
        this.detectUnusualAmount(transaction, baseline),
        this.detectDuplicate(userId, transaction),
        this.detectUnusualMerchant(userId, transaction, baseline),
        this.detectUnusualTime(transaction)
      ]);

      // Find highest severity anomaly
      const anomalies = detections.filter(d => d.isAnomaly);
      
      if (anomalies.length === 0) {
        return {
          isAnomaly: false,
          anomalyType: 'unusual_amount',
          severity: 'low',
          explanation: 'Transaction appears normal',
          suggestedAction: 'No action required'
        };
      }

      // Return highest severity anomaly
      const severityOrder = { high: 3, medium: 2, low: 1 };
      anomalies.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
      
      return anomalies[0];
      
    } catch (error) {
      logger.error('Anomaly detection error:', error);
      return {
        isAnomaly: false,
        anomalyType: 'unusual_amount',
        severity: 'low',
        explanation: 'Error during anomaly detection',
        suggestedAction: 'Manual review recommended'
      };
    }
  }

  /**
   * Calculate spending baseline for user (requires 7 days of data)
   */
  private async getSpendingBaseline(userId: string): Promise<SpendingBaseline> {
    const cacheKey = `baseline:${userId}`;
    
    // Try cache first
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache miss for baseline:', error);
    }

    // Calculate baseline from transactions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - config.baselineDays);

    const transactions = await transactionModel.find({
      userId,
      type: 'expense',
      date: { $gte: sevenDaysAgo }
    });

    if (transactions.length < 10) {
      return {
        mean: 0,
        stdDev: 0,
        knownMerchants: [],
        lastTransactionTime: 0,
        isEstablished: false,
        model: null
      };
    }

    // Calculate statistics
    const amounts = transactions.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Extract known merchants
    const knownMerchants = [...new Set(transactions.map(t => t.merchant).filter(Boolean))] as string[];

    // Get last transaction time
    const lastTransaction = transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    const lastTransactionTime = new Date(lastTransaction.date).getTime();

    const baseline: SpendingBaseline = {
      mean,
      stdDev,
      knownMerchants,
      lastTransactionTime,
      isEstablished: true,
      model: {
        transactionCount: transactions.length,
        calculatedAt: new Date()
      }
    };

    // Cache for 1 hour
    try {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(baseline));
    } catch (error) {
      logger.warn('Failed to cache baseline:', error);
    }

    return baseline;
  }

  /**
   * Detect unusual amount (3 standard deviations from mean)
   */
  private async detectUnusualAmount(
    transaction: Transaction,
    baseline: SpendingBaseline
  ): Promise<AnomalyResult> {
    const threshold = baseline.mean + (config.stdDevThreshold * baseline.stdDev);
    
    if (transaction.amount > threshold) {
      const percentageAbove = ((transaction.amount - baseline.mean) / baseline.mean * 100).toFixed(0);
      
      return {
        isAnomaly: true,
        anomalyType: 'unusual_amount',
        severity: transaction.amount > threshold * 1.5 ? 'high' : 'medium',
        explanation: `Transaction amount (${transaction.amount}) is ${percentageAbove}% above your average spending (${baseline.mean.toFixed(2)})`,
        suggestedAction: 'Verify this transaction is legitimate. If fraudulent, report immediately.'
      };
    }

    return {
      isAnomaly: false,
      anomalyType: 'unusual_amount',
      severity: 'low',
      explanation: 'Amount within normal range',
      suggestedAction: 'No action required'
    };
  }

  /**
   * Detect duplicate transactions within 5-minute window
   */
  private async detectDuplicate(
    userId: string,
    transaction: Transaction
  ): Promise<AnomalyResult> {
    const fiveMinutesAgo = new Date(transaction.date);
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - config.duplicateWindowMinutes);

    const duplicates = await transactionModel.find({
      userId,
      amount: transaction.amount,
      merchant: transaction.merchant,
      date: {
        $gte: fiveMinutesAgo,
        $lt: transaction.date
      }
    });

    if (duplicates.length > 0) {
      return {
        isAnomaly: true,
        anomalyType: 'duplicate',
        severity: 'high',
        explanation: `Duplicate transaction detected: ${transaction.amount} at ${transaction.merchant} within 5 minutes`,
        suggestedAction: 'URGENT: Check if this is a duplicate charge. Contact merchant or bank immediately.'
      };
    }

    return {
      isAnomaly: false,
      anomalyType: 'duplicate',
      severity: 'low',
      explanation: 'No duplicate detected',
      suggestedAction: 'No action required'
    };
  }

  /**
   * Detect unusual merchant (new merchant with high amount)
   */
  private async detectUnusualMerchant(
    userId: string,
    transaction: Transaction,
    baseline: SpendingBaseline
  ): Promise<AnomalyResult> {
    if (!transaction.merchant) {
      return {
        isAnomaly: false,
        anomalyType: 'unusual_merchant',
        severity: 'low',
        explanation: 'No merchant information',
        suggestedAction: 'No action required'
      };
    }

    const isKnownMerchant = baseline.knownMerchants.includes(transaction.merchant);
    const isHighAmount = transaction.amount > baseline.mean * 2;

    if (!isKnownMerchant && isHighAmount) {
      return {
        isAnomaly: true,
        anomalyType: 'unusual_merchant',
        severity: 'medium',
        explanation: `First transaction at ${transaction.merchant} with unusually high amount (${transaction.amount})`,
        suggestedAction: 'Verify this is a legitimate purchase at a new merchant.'
      };
    }

    return {
      isAnomaly: false,
      anomalyType: 'unusual_merchant',
      severity: 'low',
      explanation: 'Merchant is known or amount is normal',
      suggestedAction: 'No action required'
    };
  }

  /**
   * Detect unusual time (midnight to 6 AM)
   */
  private async detectUnusualTime(transaction: Transaction): Promise<AnomalyResult> {
    const hour = new Date(transaction.date).getHours();
    
    if (hour >= config.unusualTimeStart && hour < config.unusualTimeEnd) {
      return {
        isAnomaly: true,
        anomalyType: 'unusual_time',
        severity: 'medium',
        explanation: `Transaction occurred at unusual time: ${hour}:00 (between midnight and 6 AM)`,
        suggestedAction: 'Verify you made this transaction. Late-night transactions can be suspicious.'
      };
    }

    return {
      isAnomaly: false,
      anomalyType: 'unusual_time',
      severity: 'low',
      explanation: 'Transaction time is normal',
      suggestedAction: 'No action required'
    };
  }

  /**
   * Record false positive feedback to improve model
   */
  async recordFalsePositive(
    userId: string,
    transactionId: string,
    anomalyType: string
  ): Promise<void> {
    try {
      const feedbackKey = `false-positive:${userId}:${anomalyType}`;
      await redisClient.sAdd(feedbackKey, transactionId);
      
      // Invalidate baseline cache to trigger recalculation
      await redisClient.del(`baseline:${userId}`);
      
      logger.info(`False positive recorded for user ${userId}, type ${anomalyType}`);
    } catch (error) {
      logger.error('Failed to record false positive:', error);
    }
  }

  /**
   * Get anomaly statistics for user
   */
  async getAnomalyStats(userId: string): Promise<{
    totalAnomalies: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const transactions = await transactionModel.find({
      userId,
      isAnomaly: true
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    transactions.forEach(t => {
      if (t.anomalyScore) {
        // Count by type (would need to store anomaly type in transaction)
        byType['unknown'] = (byType['unknown'] || 0) + 1;
        
        // Count by severity based on score
        const severity = t.anomalyScore > 0.8 ? 'high' : t.anomalyScore > 0.5 ? 'medium' : 'low';
        bySeverity[severity] = (bySeverity[severity] || 0) + 1;
      }
    });

    return {
      totalAnomalies: transactions.length,
      byType,
      bySeverity
    };
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
