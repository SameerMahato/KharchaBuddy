import BankConnection, { IBankConnection } from '../models/BankConnection';
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

interface BankCredentials {
  bankId: string;
  authMethod: 'oauth' | 'credentials' | 'netbanking';
  credentials: Record<string, string>;
}

interface Transaction {
  externalId: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  description: string;
  merchant?: string;
  timestamp: Date;
  balance?: number;
}

interface WebhookPayload {
  source: string;
  eventType: string;
  data: any;
  timestamp: Date;
  signature: string;
}

export class IntegrationService {
  private setuClient: AxiosInstance;
  private finboxClient: AxiosInstance;
  private encryptionKey: Buffer;

  constructor() {
    this.setuClient = axios.create({
      baseURL: process.env.SETU_BASE_URL,
      headers: {
        'x-api-key': process.env.SETU_API_KEY,
        'x-api-secret': process.env.SETU_API_SECRET
      }
    });

    this.finboxClient = axios.create({
      baseURL: process.env.FINBOX_BASE_URL,
      headers: {
        'x-api-key': process.env.FINBOX_API_KEY
      }
    });

    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || '', 'utf-8');
  }

  async connectBank(
    userId: string,
    credentials: BankCredentials,
    provider: 'setu' | 'finbox' = 'setu'
  ): Promise<IBankConnection> {
    // Initiate OAuth flow or credential-based connection
    let connectionData: any;

    if (provider === 'setu') {
      connectionData = await this.connectViaSetu(credentials);
    } else {
      connectionData = await this.connectViaFinbox(credentials);
    }

    // Encrypt sensitive tokens
    const encryptedAccessToken = this.encrypt(connectionData.accessToken);
    const encryptedRefreshToken = connectionData.refreshToken 
      ? this.encrypt(connectionData.refreshToken) 
      : undefined;

    // Create bank connection
    const connection = new BankConnection({
      userId,
      bankName: connectionData.bankName,
      bankId: credentials.bankId,
      accountNumber: connectionData.accountNumber,
      accountType: connectionData.accountType,
      status: 'active',
      provider,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiry: connectionData.tokenExpiry,
      syncErrors: [],
      metadata: connectionData.metadata || {}
    });

    await connection.save();

    // Sync historical transactions (90 days)
    await this.syncHistoricalTransactions(connection._id.toString(), 90);

    return connection;
  }

  async syncTransactions(
    connectionId: string
  ): Promise<Transaction[]> {
    const connection = await BankConnection.findById(connectionId);
    if (!connection) {
      throw new Error('Bank connection not found');
    }

    if (connection.status !== 'active') {
      throw new Error('Bank connection is not active');
    }

    try {
      // Decrypt tokens
      const accessToken = this.decrypt(connection.accessToken || '');

      // Fetch transactions based on provider
      let transactions: Transaction[];
      if (connection.provider === 'setu') {
        transactions = await this.fetchSetuTransactions(accessToken, connection.bankId);
      } else {
        transactions = await this.fetchFinboxTransactions(accessToken, connection.bankId);
      }

      // Update last synced timestamp
      connection.lastSynced = new Date();
      await connection.save();

      return transactions;
    } catch (error: any) {
      // Log sync error
      connection.syncErrors.push({
        timestamp: new Date(),
        error: error.message,
        retryCount: 0
      });

      // If too many errors, mark as error status
      if (connection.syncErrors.length >= 3) {
        connection.status = 'error';
      }

      await connection.save();
      throw error;
    }
  }

  async syncHistoricalTransactions(
    connectionId: string,
    days: number = 90
  ): Promise<Transaction[]> {
    const connection = await BankConnection.findById(connectionId);
    if (!connection) {
      throw new Error('Bank connection not found');
    }

    const accessToken = this.decrypt(connection.accessToken || '');
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    let transactions: Transaction[];
    if (connection.provider === 'setu') {
      transactions = await this.fetchSetuTransactions(
        accessToken,
        connection.bankId,
        fromDate
      );
    } else {
      transactions = await this.fetchFinboxTransactions(
        accessToken,
        connection.bankId,
        fromDate
      );
    }

    return transactions;
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload)) {
      throw new Error('Invalid webhook signature');
    }

    // Process based on event type
    switch (payload.eventType) {
      case 'transaction.created':
        await this.processTransactionWebhook(payload.data);
        break;
      case 'account.updated':
        await this.processAccountUpdateWebhook(payload.data);
        break;
      case 'connection.error':
        await this.processConnectionErrorWebhook(payload.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${payload.eventType}`);
    }
  }

  async disconnectBank(connectionId: string): Promise<void> {
    const connection = await BankConnection.findById(connectionId);
    if (!connection) {
      throw new Error('Bank connection not found');
    }

    // Revoke tokens with provider
    try {
      const accessToken = this.decrypt(connection.accessToken || '');
      
      if (connection.provider === 'setu') {
        await this.setuClient.post('/auth/revoke', { token: accessToken });
      } else {
        await this.finboxClient.post('/auth/revoke', { token: accessToken });
      }
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
    }

    // Mark as inactive
    connection.status = 'inactive';
    connection.accessToken = undefined;
    connection.refreshToken = undefined;
    await connection.save();
  }

  async getAccountBalance(connectionId: string): Promise<number> {
    const connection = await BankConnection.findById(connectionId);
    if (!connection) {
      throw new Error('Bank connection not found');
    }

    const accessToken = this.decrypt(connection.accessToken || '');

    let balance: number;
    if (connection.provider === 'setu') {
      const response = await this.setuClient.get(`/accounts/${connection.bankId}/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      balance = response.data.balance;
    } else {
      const response = await this.finboxClient.get(`/accounts/${connection.bankId}/balance`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      balance = response.data.balance;
    }

    return balance;
  }

  async getUserConnections(userId: string): Promise<IBankConnection[]> {
    return BankConnection.find({ userId }).sort({ createdAt: -1 });
  }

  private async connectViaSetu(credentials: BankCredentials): Promise<any> {
    // Simplified OAuth flow - in production, implement full OAuth 2.0
    const response = await this.setuClient.post('/auth/connect', {
      bankId: credentials.bankId,
      authMethod: credentials.authMethod,
      credentials: credentials.credentials
    });

    return {
      bankName: response.data.bankName,
      accountNumber: response.data.accountNumber,
      accountType: response.data.accountType,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      tokenExpiry: new Date(response.data.expiresAt),
      metadata: response.data.metadata
    };
  }

  private async connectViaFinbox(credentials: BankCredentials): Promise<any> {
    const response = await this.finboxClient.post('/connect', {
      bankId: credentials.bankId,
      credentials: credentials.credentials
    });

    return {
      bankName: response.data.bank_name,
      accountNumber: response.data.account_number,
      accountType: response.data.account_type,
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      tokenExpiry: new Date(response.data.expires_at),
      metadata: response.data.metadata
    };
  }

  private async fetchSetuTransactions(
    accessToken: string,
    bankId: string,
    fromDate?: Date
  ): Promise<Transaction[]> {
    const params: any = {};
    if (fromDate) {
      params.from = fromDate.toISOString();
    }

    const response = await this.setuClient.get(`/accounts/${bankId}/transactions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params
    });

    return response.data.transactions.map((tx: any) => ({
      externalId: tx.id,
      amount: Math.abs(tx.amount),
      currency: tx.currency,
      type: tx.amount > 0 ? 'credit' : 'debit',
      description: tx.description,
      merchant: tx.merchant,
      timestamp: new Date(tx.timestamp),
      balance: tx.balance
    }));
  }

  private async fetchFinboxTransactions(
    accessToken: string,
    bankId: string,
    fromDate?: Date
  ): Promise<Transaction[]> {
    const params: any = {};
    if (fromDate) {
      params.from_date = fromDate.toISOString();
    }

    const response = await this.finboxClient.get(`/accounts/${bankId}/transactions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params
    });

    return response.data.data.map((tx: any) => ({
      externalId: tx.transaction_id,
      amount: Math.abs(tx.amount),
      currency: tx.currency || 'INR',
      type: tx.type,
      description: tx.narration,
      merchant: tx.merchant_name,
      timestamp: new Date(tx.date),
      balance: tx.balance
    }));
  }

  private verifyWebhookSignature(payload: WebhookPayload): boolean {
    const secret = process.env.UPI_WEBHOOK_SECRET || '';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload.data))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(payload.signature),
      Buffer.from(expectedSignature)
    );
  }

  private async processTransactionWebhook(data: any): Promise<void> {
    // Publish to event bus for processing by expense service
    console.log('Processing transaction webhook:', data);
    // In production: await eventBus.publish('transaction.created', data);
  }

  private async processAccountUpdateWebhook(data: any): Promise<void> {
    const connection = await BankConnection.findOne({ bankId: data.accountId });
    if (connection) {
      connection.metadata = { ...connection.metadata, ...data.updates };
      await connection.save();
    }
  }

  private async processConnectionErrorWebhook(data: any): Promise<void> {
    const connection = await BankConnection.findOne({ bankId: data.accountId });
    if (connection) {
      connection.status = 'error';
      connection.syncErrors.push({
        timestamp: new Date(),
        error: data.error,
        retryCount: 0
      });
      await connection.save();
    }
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey.slice(0, 32), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey.slice(0, 32), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
