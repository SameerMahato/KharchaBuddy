import { Router } from 'express';
import { asyncHandler, requireAuth } from '@kharchabuddy/shared';
import * as userController from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/users/profile - Get user profile
router.get('/profile', asyncHandler(userController.getProfile));

// PUT /api/users/profile - Update user profile
router.put('/profile', asyncHandler(userController.updateProfile));

// DELETE /api/users/profile - Delete user account
router.delete('/profile', asyncHandler(userController.deleteAccount));

export default router;
