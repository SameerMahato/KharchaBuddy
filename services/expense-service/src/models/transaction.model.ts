import mongoose, { Schema, Document } from 'mongoose';
import { Transaction, CategorySuggestion, ReceiptData } from '@kharchabuddy/shared';

export interface TransactionDocument extends Omit<Transaction, 'id'>, Document {}

const CategorySuggestionSchema = new Schema<CategorySuggestion>({
  category: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  reasoning: { type: String, required: true },
}, { _id: false });

const ReceiptItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const ReceiptDataSchema = new Schema<ReceiptData>({
  merchant: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  items: [ReceiptItemSchema],
  taxAmount: { type: Number },
  totalAmount: { type: Number, required: true },
}, { _id: false });

const TransactionSchema = new Schema<TransactionDocument>({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'INR' },
  type: { type: String, required: true, enum: ['expense', 'income'] },
  category: { type: String, required: true, index: true },
  subcategory: { type: String },
  description: { type: String, required: true },
  merchant: { type: String },
  date: { type: Date, required: true, index: true },
  source: { 
    type: String, 
    required: true, 
    enum: ['manual', 'bank_api', 'upi', 'sms', 'email'] 
  },
  sourceId: { type: String },
  autoCategories: [CategorySuggestionSchema],
  isAnomaly: { type: Boolean, default: false },
  anomalyScore: { type: Number, min: 0, max: 1 },
  receiptUrl: { type: String },
  receiptData: ReceiptDataSchema,
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes for performance
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1 });
TransactionSchema.index({ userId: 1, isAnomaly: 1 });

export const TransactionModel = mongoose.model<TransactionDocument>('Transaction', TransactionSchema);
