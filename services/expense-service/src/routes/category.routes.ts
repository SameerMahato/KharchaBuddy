import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authMiddleware } from '@kharchabuddy/shared';

const router = Router();

// Public routes
router.get('/', categoryController.getCategories.bind(categoryController));

// Protected routes
router.use(authMiddleware);
router.post('/categorize', categoryController.categorize.bind(categoryController));
router.post('/feedback', categoryController.submitFeedback.bind(categoryController));

export default router;
