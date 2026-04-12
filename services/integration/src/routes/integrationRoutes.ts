import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';

export function createIntegrationRoutes(controller: IntegrationController): Router {
  const router = Router();

  router.post('/banks/connect', controller.connectBank);
  router.get('/banks/connections', controller.getUserConnections);
  router.post('/banks/:connectionId/sync', controller.syncTransactions);
  router.delete('/banks/:connectionId', controller.disconnectBank);
  router.get('/banks/:connectionId/balance', controller.getAccountBalance);
  router.post('/webhooks/bank', controller.handleWebhook);

  return router;
}
