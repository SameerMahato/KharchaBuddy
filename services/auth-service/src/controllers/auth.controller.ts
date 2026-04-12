import { Request, Response } from 'express';
import { User } from '../models/User';
import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError,
  logger,
  validate,
  userRegistrationSchema,
  userLoginSchema,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
} from '@kharchabuddy/shared';

export async function register(req: Request, res: Response) {
  // Validate input
  const validatedData = validate(userRegistrationSchema, req.body);

  // Check if user exists
  const existingUser = await User.findOne({ 
    $or: [{ email: validatedData.email }, { phone: validatedData.phone }] 
  });

  if (existingUser) {
    throw new ConflictError('User with this email or phone already exists');
  }

  // Create user
  const user = await User.create(validatedData);

  // Generate tokens
  const accessToken = generateToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  logger.info('User registered successfully', { userId: user.id, email: user.email });

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      accessToken,
      refreshToken
    }
  });
}

export async function login(req: Request, res: Response) {
  // Validate input
  const { email, password } = validate(userLoginSchema, req.body);

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last active
  user.lastActive = new Date();
  await user.save();

  // Generate tokens
  const accessToken = generateToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone
      },
      accessToken,
      refreshToken
    }
  });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Find user
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Generate new tokens
  const newAccessToken = generateToken({ userId: user.id, email: user.email });
  const newRefreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }
  });
}

export async function logout(req: Request, res: Response) {
  // In a production system, you would invalidate the refresh token here
  // For now, we'll just return success
  
  logger.info('User logged out', { userId: req.user?.userId });

  res.json({
    success: true,
    data: {
      message: 'Logged out successfully'
    }
  });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if user exists
    res.json({
      success: true,
      data: {
        message: 'If the email exists, a password reset link has been sent'
      }
    });
    return;
  }

  // TODO: Generate reset token and send email
  logger.info('Password reset requested', { userId: user.id, email: user.email });

  res.json({
    success: true,
    data: {
      message: 'If the email exists, a password reset link has been sent'
    }
  });
}

export async function resetPassword(req: Request, res: Response) {
  // TODO: Implement password reset logic
  res.json({
    success: true,
    data: {
      message: 'Password reset successfully'
    }
  });
}
