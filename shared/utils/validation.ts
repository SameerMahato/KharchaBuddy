import { z } from 'zod';
import { ValidationError } from './errors';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number');
export const positiveNumberSchema = z.number().positive('Must be a positive number');
export const dateSchema = z.date().max(new Date(), 'Date cannot be in the future');
export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY', 'BRL', 'MXN']);

// Transaction validation
export const transactionSchema = z.object({
  amount: positiveNumberSchema,
  currency: currencySchema.optional().default('INR'),
  type: z.enum(['expense', 'income']),
  category: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  date: dateSchema.optional().default(() => new Date()),
  merchant: z.string().max(100).optional()
});

// Budget validation
export const budgetSchema = z.object({
  name: z.string().min(1).max(100),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  totalAmount: positiveNumberSchema,
  categories: z.array(z.object({
    category: z.string().min(1),
    allocated: positiveNumberSchema,
    isFlexible: z.boolean().default(true)
  })).min(1)
}).refine(
  (data) => {
    const total = data.categories.reduce((sum, cat) => sum + cat.allocated, 0);
    return Math.abs(total - data.totalAmount) < 0.01; // Allow small floating point errors
  },
  { message: 'Sum of category allocations must equal total budget amount' }
);

// Loan validation
export const loanSchema = z.object({
  friendName: z.string().min(1).max(100),
  amount: positiveNumberSchema,
  currency: currencySchema.optional().default('INR'),
  type: z.enum(['given', 'received']),
  description: z.string().max(500).optional(),
  expectedReturnDate: z.date().min(new Date()).optional(),
  notes: z.string().max(1000).optional()
});

// Goal validation
export const goalSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['savings', 'investment', 'debt_payoff', 'purchase', 'retirement']),
  targetAmount: positiveNumberSchema,
  currentAmount: z.number().min(0).default(0),
  targetDate: z.date().min(new Date()),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  autoContribute: z.boolean().default(false),
  monthlyContribution: positiveNumberSchema.optional()
}).refine(
  (data) => data.targetAmount > data.currentAmount,
  { message: 'Target amount must be greater than current amount' }
);

// User registration validation
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100),
  phone: phoneSchema,
  monthlyIncome: positiveNumberSchema.optional()
});

// User login validation
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Validation helper function
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new ValidationError(`Validation failed: ${messages}`);
    }
    throw error;
  }
}

// Async validation helper
export async function validateAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new ValidationError(`Validation failed: ${messages}`);
    }
    throw error;
  }
}
