import { Request, Response } from 'express';
import { IntegrationService } from '../services/integrationService';
import { z } from 'zod';

const connectBankSchema = z.object({
  bankId: z.string(),
  authMethod: z.enum(['oauth', 'credentials', 'netbanking']),
  credentials: z.record(z.string()),
  provider: z.enum(['setu', 'finbox']).default('setu')
});

export class IntegrationController {
  constructor(private integrationService: IntegrationService) {}

  connectBank = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { bankId, authMethod, credentials, provider } = connectBankSchema.parse(req.body);

      const connection = await this.integrationService.connectBank(
        userId,
        { bankId, authMethod, credentials },
        provider
      );

      res.status(201).json({
        success: true,
        data: connection
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BANK_CONNECTION_ERROR',
          message: error.message
        }
      });
    }
  };

  syncTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { connectionId } = req.params;

      const transactions = await this.integrationService.syncTransactions(connectionId);

      res.json({
        success: true,
        data: transactions,
        metadata: {
          count: transactions.length
        }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error.message
        }
      });
    }
  };

  handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.integrationService.handleWebhook(req.body);

      res.json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: error.message
        }
      });
    }
  };

  disconnectBank = async (req: Request, res: Response): Promise<void> => {
    try {
      const { connectionId } = req.params;

      await this.integrationService.disconnectBank(connectionId);

      res.json({
        success: true,
        message: 'Bank disconnected successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DISCONNECT_ERROR',
          message: error.message
        }
      });
    }
  };

  getAccountBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { connectionId } = req.params;

      const balance = await this.integrationService.getAccountBalance(connectionId);

      res.json({
        success: true,
        data: { balance }
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BALANCE_FETCH_ERROR',
          message: error.message
        }
      });
    }
  };

  getUserConnections = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;

      const connections = await this.integrationService.getUserConnections(userId);

      res.json({
        success: true,
        data: connections
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CONNECTIONS_FETCH_ERROR',
          message: error.message
        }
      });
    }
  };
}
