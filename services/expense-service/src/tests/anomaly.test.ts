import { anomalyDetectionService } from '../services/anomaly.service';
import { Transaction } from '../../../../shared/types';

describe('Anomaly Detection Service', () => {
  const mockUserId = 'test-user-123';

  describe('Unusual Amount Detection', () => {
    it('should detect unusually high transaction amount', async () => {
      const transaction: Transaction = {
        id: '1',
        userId: mockUserId,
        amount: 50000, // Much higher than average
        currency: 'INR',
        type: 'expense',
        category: 'Shopping',
        description: 'Test transaction',
        date: new Date(),
        source: 'manual',
        autoCategories: [],
        isAnomaly: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await anomalyDetectionService.detectAnomaly(mockUserId, transaction);
      
      expect(result.isAnomaly).toBe(true);
      expect(result.anomalyType).toBe('unusual_amount');
      expect(result.severity).toBeOneOf(['medium', 'high']);
    });

    it('should not flag normal transaction amounts', async () => {
      const transaction: Transaction = {
        id: '2',
        userId: mockUserId,
        amount: 500, // Normal amount
        currency: 'INR',
        type: 'expense',
        category: 'Food',
        description: 'Lunch',
        date: new Date(),
        source: 'manual',
        autoCategories: [],
        isAnomaly: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await anomalyDetectionService.detectAnomaly(mockUserId, transaction);
      
      expect(result.isAnomaly).toBe(false);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate transactions within 5 minutes', async () => {
      const transaction: Transaction = {
        id: '3',
        userId: mockUserId,
        amount: 1000,
        currency: 'INR',
        type: 'expense',
        category: 'Shopping',
        description: 'Purchase',
        merchant: 'Test Store',
        date: new Date(),
        source: 'manual',
        autoCategories: [],
        isAnomaly: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // First transaction
      await anomalyDetectionService.detectAnomaly(mockUserId, transaction);

      // Duplicate within 5 minutes
      const duplicate = { ...transaction, id: '4', date: new Date() };
      const result = await anomalyDetectionService.detectAnomaly(mockUserId, duplicate);

      expect(result.isAnomaly).toBe(true);
      expect(result.anomalyType).toBe('duplicate');
      expect(result.severity).toBe('high');
    });
  });

  describe('Unusual Time Detection', () => {
    it('should detect transactions at unusual hours (midnight-6AM)', async () => {
      const lateNightDate = new Date();
      lateNightDate.setHours(2, 0, 0, 0); // 2 AM

      const transaction: Transaction = {
        id: '5',
        userId: mockUserId,
        amount: 1000,
        currency: 'INR',
        type: 'expense',
        category: 'Shopping',
        description: 'Late night purchase',
        date: lateNightDate,
        source: 'manual',
        autoCategories: [],
        isAnomaly: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await anomalyDetectionService.detectAnomaly(mockUserId, transaction);

      expect(result.isAnomaly).toBe(true);
      expect(result.anomalyType).toBe('unusual_time');
      expect(result.severity).toBe('medium');
    });

    it('should not flag transactions during normal hours', async () => {
      const normalDate = new Date();
      normalDate.setHours(14, 0, 0, 0); // 2 PM

      const transaction: Transaction = {
        id: '6',
        userId: mockUserId,
        amount: 1000,
        currency: 'INR',
        type: 'expense',
        category: 'Shopping',
        description: 'Afternoon purchase',
        date: normalDate,
        source: 'manual',
        autoCategories: [],
        isAnomaly: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await anomalyDetectionService.detectAnomaly(mockUserId, transaction);

      expect(result.anomalyType).not.toBe('unusual_time');
    });
  });

  describe('False Positive Feedback', () => {
    it('should record false positive feedback', async () => {
      await expect(
        anomalyDetectionService.recordFalsePositive(
          mockUserId,
          'transaction-123',
          'unusual_amount'
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Anomaly Statistics', () => {
    it('should return anomaly statistics for user', async () => {
      const stats = await anomalyDetectionService.getAnomalyStats(mockUserId);

      expect(stats).toHaveProperty('totalAnomalies');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('bySeverity');
      expect(typeof stats.totalAnomalies).toBe('number');
    });
  });
});
