import { Request, Response } from 'express';
import { User } from '../models/User';
import { NotFoundError, logger } from '@kharchabuddy/shared';

export async function getProfile(req: Request, res: Response) {
  const user = await User.findById(req.user!.userId).select('-password -tokenVersion');

  if (!user) {
    throw new NotFoundError('User');
  }

  res.json({
    success: true,
    data: { user }
  });
}

export async function updateProfile(req: Request, res: Response) {
  const allowedUpdates = ['name', 'phone', 'monthlyIncome', 'currency', 'riskTolerance', 'aiPersonality', 'nudgeFrequency', 'communicationChannels'];
  const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));

  const user = await User.findById(req.user!.userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  updates.forEach(update => {
    (user as any)[update] = req.body[update];
  });

  await user.save();

  logger.info('User profile updated', { userId: user.id });

  res.json({
    success: true,
    data: { 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        monthlyIncome: user.monthlyIncome,
        currency: user.currency
      }
    }
  });
}

export async function deleteAccount(req: Request, res: Response) {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Soft delete
  user.isActive = false;
  await user.save();

  logger.info('User account deleted', { userId: user.id });

  res.json({
    success: true,
    data: {
      message: 'Account deleted successfully'
    }
  });
}
