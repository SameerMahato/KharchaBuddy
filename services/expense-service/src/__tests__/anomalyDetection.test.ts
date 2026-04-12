import { detectAnomalies } from '../services/anomalyDetectionService';

describe('Anomaly Detection', () => {
  describe('detectAnomalies', () => {
    it('should detect unusually high amounts', async () => {
      const transaction = {
        userId: 'user123',
        amount: 50000, // Very high amount
        category: 'Food',
        merchant: 'Restaurant',
        date: new Date(),
      };

      const result = await detectAnomalies(transaction);

      expect(result.isAnomaly).toBe(true);
      expect(result.reasons).toContain('unusual_amount');
    });

    it('should not flag normal transactions', async () => {
      const transaction = {
        userId: 'user123',
        amount: 500, // Normal amount
        category: 'Food',
        merchant: 'Restaurant',
        date: new Date(),
      };

      const result = await detectAnomalies(transaction);

      expect(result.isAnomaly).toBe(false);
    });

    it('should detect duplicate transactions', async () => {
      const transaction = {
        userId: 'user123',
        amount: 1000,
        category: 'Food',
        merchant: 'Restaurant',
        date: new Date(),
      };

      // First transaction
      await detectAnomalies(transaction);

      // Duplicate within 5 minutes
      const result = await detectAnomalies(transaction);

      expect(result.isAnomaly).toBe(true);
      expect(result.reasons).toContain('duplicate_transaction');
    });

    it('should detect unusual time transactions', async () => {
      const transaction = {
        userId: 'user123',
        amount: 1000,
        category: 'Food',
        merchant: 'Restaurant',
        date: new Date('2024-01-01T03:00:00Z'), // 3 AM
      };

      const result = await detectAnomalies(transaction);

      expect(result.isAnomaly).toBe(true);
      expect(result.reasons).toContain('unusual_time');
    });
  });
});
