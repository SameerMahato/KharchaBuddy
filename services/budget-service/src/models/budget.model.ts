import mongoose, { Schema, Document } from 'mongoose';

export interface CategoryBudget {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
  isFlexible: boolean;
}

export interface AdaptationRule {
  trigger: 'overspend' | 'underspend' | 'pattern_change';
  action: 'increase' | 'decrease' | 'reallocate';
  threshold: number;
  enabled: boolean;
}

export interface BudgetAdjustment {
  timestamp: Date;
  reason: string;
  changes: CategoryChange[];
  triggeredBy: 'system' | 'user' | 'ai';
}

export interface CategoryChange {
  category: string;
  oldAllocation: number;
  newAllocation: number;
  change: number;
  reason: string;
}

export interface SmartSavingConfig {
  enabled: boolean;
  aggressiveness: 'low' | 'medium' | 'high';
  targetSavingsRate: number;
  protectedCategories: string[];
}

export interface IBudget extends Document {
  userId: string;
  name: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate?: Date;
  categories: CategoryBudget[];
  totalAmount: number;
  isAdaptive: boolean;
  adaptationRules: AdaptationRule[];
  adjustmentHistory: BudgetAdjustment[];
  smartSavingEnabled: boolean;
  smartSavingConfig?: SmartSavingConfig;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  period: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  categories: [{
    category: { type: String, required: true },
    allocated: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    remaining: { type: Number, required: true },
    percentage: { type: Number, required: true },
    isFlexible: { type: Boolean, default: true }
  }],
  totalAmount: { type: Number, required: true },
  isAdaptive: { type: Boolean, default: false },
  adaptationRules: [{
    trigger: { type: String, enum: ['overspend', 'underspend', 'pattern_change'] },
    action: { type: String, enum: ['increase', 'decrease', 'reallocate'] },
    threshold: { type: Number },
    enabled: { type: Boolean, default: true }
  }],
  adjustmentHistory: [{
    timestamp: { type: Date },
    reason: { type: String },
    changes: [{
      category: String,
      oldAllocation: Number,
      newAllocation: Number,
      change: Number,
      reason: String
    }],
    triggeredBy: { type: String, enum: ['system', 'user', 'ai'] }
  }],
  smartSavingEnabled: { type: Boolean, default: false },
  smartSavingConfig: {
    enabled: { type: Boolean },
    aggressiveness: { type: String, enum: ['low', 'medium', 'high'] },
    targetSavingsRate: { type: Number },
    protectedCategories: [{ type: String }]
  },
  version: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
BudgetSchema.index({ userId: 1, period: 1, startDate: -1 });
BudgetSchema.index({ userId: 1, isAdaptive: 1 });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
