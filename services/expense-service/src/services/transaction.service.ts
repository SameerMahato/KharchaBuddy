import { TransactionModel } from '../models/transaction.model';
import { Transaction, RawTransaction, CategorySuggestion } from '@kharchabuddy/shared';
import { getKafkaProducer } from '../config/kafka';
import { logger } from '@kharchabuddy/shared';
import { categorizationService } from './categorization.service';
import { ValidationError } from '@kharchabuddy/shared';

export class TransactionService {
  /**
   * Process a raw transaction: validate, normalize, categorize, persist, and publish event
   */
  async processTransaction(userId: string, rawTransaction: RawTransaction): Promise<Transaction> {
    const startTime = Date.now();

    try {
      // Validate transaction
      this.validateTransaction(rawTransaction);

      // Auto-categorize using ML
      const categorization = await categorizationService.categorizeTransaction(
        rawTransaction.merchant || rawTransaction.rawText || '',
        rawTransaction.amount
      );

      // Create transaction document
      const transaction = await TransactionModel.create({
        userId,
        amount: rawTransaction.amount,
        currency: rawTransaction.currency || 'INR',
        type: 'expense',
        category: categorization.category,
        subcategory: categorization.subcategory,
        description: rawTransaction.merchant || 'Transaction',
        merchant: rawTransaction.merchant,
        date: rawTransaction.timestamp,
        source: rawTransaction.source,
        sourceId: rawTransaction.sourceId,
        autoCategories: categorization.suggestions,
        isAnomaly: false,
      });

      // Publish event to Kafka
      await this.publishTransactionCreatedEvent(transaction.toJSON());

      const processingTime = Date.now() - startTime;
      logger.info(`Transaction processed in ${processingTime}ms`, { transactionId: transaction.id });

      return transaction.toJSON();
    } catch (error) {
      logger.error('Failed to process transaction:', error);
      throw error;
    }
  }

  /**
   * Get transactions for a user with filtering and pagination
   */
  async getTransactions(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
      type?: 'expense' | 'income';
      minAmount?: number;
      maxAmount?: number;
    },
    pagination: {
      page: number;
      pageSize: number;
    }
  ): Promise<{ transactions: Transaction[]; total: number; hasMore: boolean }> {
    const query: any = { userId };

    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) query.date.$gte = filters.startDate;
      if (filters.endDate) query.date.$lte = filters.endDate;
    }

    if (filters.category) query.category = filters.category;
    if (filters.type) query.type = filters.type;

    if (filters.minAmount || filters.maxAmount) {
      query.amount = {};
      if (filters.minAmount) query.amount.$gte = filters.minAmount;
      if (filters.maxAmount) query.amount.$lte = filters.maxAmount;
    }

    const skip = (pagination.page - 1) * pagination.pageSize;

    const [transactions, total] = await Promise.all([
      TransactionModel.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(pagination.pageSize)
        .lean(),
      TransactionModel.countDocuments(query),
    ]);

    return {
      transactions: transactions.map(t => ({
        ...t,
        id: t._id.toString(),
        _id: undefined,
        __v: undefined,
      } as any)),
      total,
      hasMore: skip + transactions.length < total,
    };
  }

  /**
   * Get a single transaction by ID
   */
  async getTransactionById(userId: string, transactionId: string): Promise<Transaction | null> {
    const transaction = await TransactionModel.findOne({ _id: transactionId, userId }).lean();
    
    if (!transaction) return null;

    return {
      ...transaction,
      id: transaction._id.toString(),
      _id: undefined,
      __v: undefined,
    } as any;
  }

  /**
   * Update a transaction
   */
  async updateTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> {
    const transaction = await TransactionModel.findOneAndUpdate(
      { _id: transactionId, userId },
      { $set: updates },
      { new: true }
    );

    if (!transaction) return null;

    return transaction.toJSON();
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(userId: string, transactionId: string): Promise<boolean> {
    const result = await TransactionModel.deleteOne({ _id: transactionId, userId });
    return result.deletedCount > 0;
  }

  /**
   * Get spending by category for a date range
   */
  async getSpendingByCategory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ category: string; total: number; count: number }>> {
    const result = await TransactionModel.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    return result;
  }

  /**
   * Validate transaction data
   */
  private validateTransaction(transaction: RawTransaction): void {
    if (!transaction.amount || transaction.amount <= 0) {
      throw new ValidationError('Amount must be positive');
    }

    if (!transaction.timestamp) {
      throw new ValidationError('Timestamp is required');
    }

    if (transaction.timestamp > new Date()) {
      throw new ValidationError('Transaction date cannot be in the future');
    }

    if (!['manual', 'bank_api', 'upi', 'sms', 'email'].includes(transaction.source)) {
      throw new ValidationError('Invalid transaction source');
    }
  }

  /**
   * Publish transaction.created event to Kafka
   */
  private async publishTransactionCreatedEvent(transaction: Transaction): Promise<void> {
    try {
      const producer = getKafkaProducer();
      
      await producer.send({
        topic: 'transaction.created',
        messages: [
          {
            key: transaction.userId,
            value: JSON.stringify({
              type: 'transaction.created',
              userId: transaction.userId,
              data: {
                transactionId: transaction.id,
                amount: transaction.amount,
                category: transaction.category,
                timestamp: transaction.date,
              },
              timestamp: new Date(),
            }),
          },
        ],
      });

      logger.info('Published transaction.created event', { transactionId: transaction.id });
    } catch (error) {
      logger.error('Failed to publish transaction.created event:', error);
      // Don't throw - event publishing failure shouldn't fail the transaction
    }
  }
}

export const transactionService = new TransactionService();
