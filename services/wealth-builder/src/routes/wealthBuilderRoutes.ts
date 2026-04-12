import { Router } from 'express';
import { WealthBuilderController } from '../controllers/wealthBuilderController';

export function createWealthBuilderRoutes(controller: WealthBuilderController): Router {
  const router = Router();

  router.post('/goals', controller.createGoal);
  router.get('/goals', controller.getUserGoals);
  router.post('/goals/:goalId/contributions', controller.addContribution);
  router.get('/goals/:goalId/progress', controller.getGoalProgress);
  router.post('/roundup/process', controller.processRoundUp);
  router.post('/roundup/configure', controller.configureRoundUp);

  return router;
}
