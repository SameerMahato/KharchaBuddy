import { Router } from 'express';
import { TaxOptimizerController } from '../controllers/taxOptimizerController';

export function createTaxOptimizerRoutes(controller: TaxOptimizerController): Router {
  const router = Router();

  router.post('/analyze', controller.analyzeTaxSituation);
  router.get('/optimize/80c/:financialYear', controller.optimize80C);
  router.post('/deductions', controller.trackDeduction);
  router.get('/deductions', controller.getDeductions);
  router.post('/calculate', controller.calculateTaxLiability);
  router.get('/alerts/:financialYear', controller.getTaxAlerts);

  return router;
}
