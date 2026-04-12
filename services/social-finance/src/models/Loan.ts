import mongoose, { Schema, Document } from 'mongoose';

export interface IPartialPayment {
  amount: number;
  date: Date;
  notes: string;
}

export interface IReminderLog {
  sentAt: Date;
  channel: 'sms' | 'email' | 'push';
  tone: 'friendly' | 'neutral' | 'firm';
  response?: string;
}

export interface IReminderConfig {
  frequency: 'daily' | 'weekly' | 'biweekly';
  tone: 'friendly' | 'neutral' | 'firm';
  escalation: boolean;
  channels: ('sms' | 'email' | 'push')[];
}

export interface ILoan extends Document {
  userId: string;
  friendId?: string;
  friendName: string;
  amount: number;
  remainingAmount: number;
  currency: string;
  type: 'given' | 'received';
  dateGiven: Date;
  expectedReturnDate?: Date;
  dateReturned?: Date;
  isPaidBack: boolean;
  isReturnedOnTime?: boolean;
  partialPayments: IPartialPayment[];
  trustScoreAtTime: number;
  riskLevel: 'low' | 'medium' | 'high';
  reminderConfig?: IReminderConfig;
  remindersSent: IReminderLog[];
  description: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartialPaymentSchema = new Schema<IPartialPayment>({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  notes: { type: String, default: '' }
});

const ReminderLogSchema = new Schema<IReminderLog>({
  sentAt: { type: Date, required: true },
  channel: { type: String, enum: ['sms', 'email', 'push'], required: true },
  tone: { type: String, enum: ['friendly', 'neutral', 'firm'], required: true },
  response: { type: String }
});

const ReminderConfigSchema = new Schema<IReminderConfig>({
  frequency: { type: String, enum: ['daily', 'weekly', 'biweekly'], required: true },
  tone: { type: String, enum: ['friendly', 'neutral', 'firm'], required: true },
  escalation: { type: Boolean, default: false },
  channels: [{ type: String, enum: ['sms', 'email', 'push'] }]
});

const LoanSchema = new Schema<ILoan>({
  userId: { type: String, required: true, index: true },
  friendId: { type: String, index: true },
  friendName: { type: String, required: true },
  amount: { type: Number, required: true },
  remainingAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  type: { type: String, enum: ['given', 'received'], required: true },
  dateGiven: { type: Date, required: true },
  expectedReturnDate: { type: Date },
  dateReturned: { type: Date },
  isPaidBack: { type: Boolean, default: false },
  isReturnedOnTime: { type: Boolean },
  partialPayments: [PartialPaymentSchema],
  trustScoreAtTime: { type: Number, default: 50 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  reminderConfig: ReminderConfigSchema,
  remindersSent: [ReminderLogSchema],
  description: { type: String, default: '' },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

LoanSchema.index({ userId: 1, isPaidBack: 1 });
LoanSchema.index({ userId: 1, friendId: 1 });
LoanSchema.index({ expectedReturnDate: 1, isPaidBack: 1 });

export default mongoose.model<ILoan>('Loan', LoanSchema);
