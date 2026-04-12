import { Router } from 'express';
import { SocialFinanceController } from '../controllers/socialFinanceController';

export function createSocialFinanceRoutes(controller: SocialFinanceController): Router {
  const router = Router();

  router.post('/loans', controller.createLoan);
  router.get('/loans', controller.getLoans);
  router.get('/loans/:loanId', controller.getLoanById);
  router.post('/loans/:loanId/payments', controller.recordPartialPayment);
  router.get('/trust-score/:friendId', controller.getTrustScore);

  return router;
}
