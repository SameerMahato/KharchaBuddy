import mongoose, { Schema, Document } from 'mongoose';

export interface Action {
  type: string;
  label: string;
  data?: any;
}

export interface INudge extends Document {
  userId: string;
  budgetId: string;
  category: string;
  type: 'warning' | 'suggestion' | 'achievement';
  message: string;
  tone: 'gentle' | 'firm' | 'encouraging';
  actionable: boolean;
  actions: Action[];
  trigger: {
    type: string;
    threshold: number;
    currentValue: number;
  };
  status: 'sent' | 'read' | 'acted' | 'dismissed';
  channels: ('email' | 'sms' | 'push')[];
  sentAt: Date;
  readAt?: Date;
  actedAt?: Date;
  createdAt: Date;
}

const NudgeSchema = new Schema<INudge>({
  userId: { type: String, required: true, index: true },
  budgetId: { type: String, required: true },
  category: { type: String, required: true },
  type: { type: String, enum: ['warning', 'suggestion', 'achievement'], required: true },
  message: { type: String, required: true },
  tone: { type: String, enum: ['gentle', 'firm', 'encouraging'], required: true },
  actionable: { type: Boolean, default: false },
  actions: [{
    type: { type: String },
    label: { type: String },
    data: { type: Schema.Types.Mixed }
  }],
  trigger: {
    type: { type: String },
    threshold: { type: Number },
    currentValue: { type: Number }
  },
  status: { type: String, enum: ['sent', 'read', 'acted', 'dismissed'], default: 'sent' },
  channels: [{ type: String, enum: ['email', 'sms', 'push'] }],
  sentAt: { type: Date, default: Date.now },
  readAt: { type: Date },
  actedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes
NudgeSchema.index({ userId: 1, sentAt: -1 });
NudgeSchema.index({ userId: 1, status: 1 });
NudgeSchema.index({ userId: 1, category: 1, sentAt: -1 });

export const Nudge = mongoose.model<INudge>('Nudge', NudgeSchema);
