import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  monthlyIncome?: number;
  currency: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  aiPersonality: 'professional' | 'friendly' | 'casual';
  nudgeFrequency: 'high' | 'medium' | 'low';
  communicationChannels: ('email' | 'sms' | 'push')[];
  tokenVersion: number;
  isActive: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  monthlyIncome: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY', 'BRL', 'MXN']
  },
  riskTolerance: {
    type: String,
    default: 'moderate',
    enum: ['conservative', 'moderate', 'aggressive']
  },
  aiPersonality: {
    type: String,
    default: 'friendly',
    enum: ['professional', 'friendly', 'casual']
  },
  nudgeFrequency: {
    type: String,
    default: 'medium',
    enum: ['high', 'medium', 'low']
  },
  communicationChannels: {
    type: [String],
    default: ['email', 'push'],
    enum: ['email', 'sms', 'push']
  },
  tokenVersion: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
