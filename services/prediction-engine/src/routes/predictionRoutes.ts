import { Router } from 'express';
import { PredictionController } from '../controllers/predictionController';

export function createPredictionRoutes(controller: PredictionController): Router {
  const router = Router();

  router.get('/expenses', controller.predictExpenses);
  router.post('/cashflow', controller.forecastCashFlow);
  router.get('/recurring', controller.getRecurringTransactions);

  return router;
}
