import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestone {
  percentage: number;
  amount: number;
  targetDate: Date;
  achieved: boolean;
  achievedDate?: Date;
}

export interface IContribution {
  amount: number;
  date: Date;
  source: 'manual' | 'auto' | 'roundup';
}

export interface IFinancialGoal extends Document {
  userId: string;
  name: string;
  type: 'savings' | 'investment' | 'debt_payoff' | 'purchase' | 'retirement';
  targetAmount: number;
  currentAmount: number;
  currency: string;
  startDate: Date;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  autoContribute: boolean;
  monthlyContribution?: number;
  milestones: IMilestone[];
  contributions: IContribution[];
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  percentage: { type: Number, required: true },
  amount: { type: Number, required: true },
  targetDate: { type: Date, required: true },
  achieved: { type: Boolean, default: false },
  achievedDate: { type: Date }
});

const ContributionSchema = new Schema<IContribution>({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  source: { type: String, enum: ['manual', 'auto', 'roundup'], required: true }
});

const FinancialGoalSchema = new Schema<IFinancialGoal>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['savings', 'investment', 'debt_payoff', 'purchase', 'retirement'], 
    required: true 
  },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  startDate: { type: Date, required: true },
  targetDate: { type: Date, required: true },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'medium' 
  },
  autoContribute: { type: Boolean, default: false },
  monthlyContribution: { type: Number },
  milestones: [MilestoneSchema],
  contributions: [ContributionSchema],
  status: { 
    type: String, 
    enum: ['active', 'completed', 'paused', 'cancelled'], 
    default: 'active' 
  },
  completedAt: { type: Date }
}, {
  timestamps: true
});

FinancialGoalSchema.index({ userId: 1, status: 1 });
FinancialGoalSchema.index({ userId: 1, priority: -1 });

export default mongoose.model<IFinancialGoal>('FinancialGoal', FinancialGoalSchema);
