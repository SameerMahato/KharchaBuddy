import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authMiddleware } from '@kharchabuddy/shared';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Transaction CRUD
router.post('/', transactionController.createTransaction.bind(transactionController));
router.get('/', transactionController.getTransactions.bind(transactionController));
router.get('/analytics/by-category', transactionController.getSpendingByCategory.bind(transactionController));
router.get('/:id', transactionController.getTransactionById.bind(transactionController));
router.put('/:id', transactionController.updateTransaction.bind(transactionController));
router.delete('/:id', transactionController.deleteTransaction.bind(transactionController));

export default router;
