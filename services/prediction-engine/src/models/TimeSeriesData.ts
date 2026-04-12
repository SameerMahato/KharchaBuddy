import { Pool } from 'pg';

export interface TimeSeriesDataPoint {
  userId: string;
  timestamp: Date;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  merchant?: string;
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
  isWeekend: boolean;
  isMonthStart: boolean;
  isMonthEnd: boolean;
}

export class TimeSeriesDataStore {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS transaction_timeseries (
        user_id VARCHAR(255) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        merchant VARCHAR(255),
        day_of_week INTEGER,
        day_of_month INTEGER,
        month INTEGER,
        is_weekend BOOLEAN,
        is_month_start BOOLEAN,
        is_month_end BOOLEAN,
        PRIMARY KEY (user_id, timestamp)
      );
    `);

    await this.pool.query(`
      SELECT create_hypertable('transaction_timeseries', 'timestamp', 
        if_not_exists => TRUE);
    `);

    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_category 
      ON transaction_timeseries (user_id, category, timestamp DESC);
    `);
  }

  async insertDataPoint(data: TimeSeriesDataPoint): Promise<void> {
    await this.pool.query(`
      INSERT INTO transaction_timeseries (
        user_id, timestamp, amount, category, type, merchant,
        day_of_week, day_of_month, month, is_weekend, is_month_start, is_month_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id, timestamp) DO UPDATE SET
        amount = EXCLUDED.amount,
        category = EXCLUDED.category,
        type = EXCLUDED.type,
        merchant = EXCLUDED.merchant
    `, [
      data.userId,
      data.timestamp,
      data.amount,
      data.category,
      data.type,
      data.merchant,
      data.dayOfWeek,
      data.dayOfMonth,
      data.month,
      data.isWeekend,
      data.isMonthStart,
      data.isMonthEnd
    ]);
  }

  async getHistoricalData(
    userId: string,
    category?: string,
    limit: number = 1000
  ): Promise<TimeSeriesDataPoint[]> {
    const query = category
      ? `SELECT * FROM transaction_timeseries 
         WHERE user_id = $1 AND category = $2 
         ORDER BY timestamp DESC LIMIT $3`
      : `SELECT * FROM transaction_timeseries 
         WHERE user_id = $1 
         ORDER BY timestamp DESC LIMIT $2`;

    const params = category ? [userId, category, limit] : [userId, limit];
    const result = await this.pool.query(query, params);

    return result.rows.map(row => ({
      userId: row.user_id,
      timestamp: row.timestamp,
      amount: parseFloat(row.amount),
      category: row.category,
      type: row.type,
      merchant: row.merchant,
      dayOfWeek: row.day_of_week,
      dayOfMonth: row.day_of_month,
      month: row.month,
      isWeekend: row.is_weekend,
      isMonthStart: row.is_month_start,
      isMonthEnd: row.is_month_end
    }));
  }

  async getAggregatedStats(userId: string, category?: string): Promise<any> {
    const query = category
      ? `SELECT 
           AVG(amount) as mean,
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) as median,
           STDDEV(amount) as std_dev,
           COUNT(*) as count,
           MIN(timestamp) as first_date,
           MAX(timestamp) as last_date
         FROM transaction_timeseries
         WHERE user_id = $1 AND category = $2`
      : `SELECT 
           AVG(amount) as mean,
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) as median,
           STDDEV(amount) as std_dev,
           COUNT(*) as count,
           MIN(timestamp) as first_date,
           MAX(timestamp) as last_date
         FROM transaction_timeseries
         WHERE user_id = $1`;

    const params = category ? [userId, category] : [userId];
    const result = await this.pool.query(query, params);
    return result.rows[0];
  }
}
