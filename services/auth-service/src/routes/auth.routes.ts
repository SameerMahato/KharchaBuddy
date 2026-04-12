import { Router } from 'express';
import { asyncHandler } from '@kharchabuddy/shared';
import * as authController from '../controllers/auth.controller';
import { authRateLimit } from '../middleware/rateLimits';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', authRateLimit, asyncHandler(authController.register));

// POST /api/auth/login - Login user
router.post('/login', authRateLimit, asyncHandler(authController.login));

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', asyncHandler(authController.refreshToken));

// POST /api/auth/logout - Logout user
router.post('/logout', asyncHandler(authController.logout));

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', authRateLimit, asyncHandler(authController.forgotPassword));

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', asyncHandler(authController.resetPassword));

export default router;
