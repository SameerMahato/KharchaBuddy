import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';

const router = Router();
const budgetController = new BudgetController();

router.post('/', budgetController.createBudget.bind(budgetController));
router.get('/', budgetController.getUserBudgets.bind(budgetController));
router.get('/active', budgetController.getActiveBudget.bind(budgetController));
router.get('/analysis', budgetController.analyzeBudgetPerformance.bind(budgetController));
router.get('/:budgetId', budgetController.getBudget.bind(budgetController));
router.post('/:budgetId/adjust', budgetController.adjustBudget.bind(budgetController));
router.post('/smart-saving/enable', budgetController.enableSmartSaving.bind(budgetController));

export default router;
