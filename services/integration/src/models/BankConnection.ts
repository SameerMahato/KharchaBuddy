import mongoose, { Schema, Document } from 'mongoose';

export interface IBankConnection extends Document {
  userId: string;
  bankName: string;
  bankId: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'credit';
  status: 'active' | 'inactive' | 'error';
  provider: 'setu' | 'finbox';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  lastSynced?: Date;
  syncErrors: Array<{
    timestamp: Date;
    error: string;
    retryCount: number;
  }>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const BankConnectionSchema = new Schema<IBankConnection>({
  userId: { type: String, required: true, index: true },
  bankName: { type: String, required: true },
  bankId: { type: String, required: true },
  accountNumber: { type: String, required: true },
  accountType: { 
    type: String, 
    enum: ['savings', 'current', 'credit'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'error'], 
    default: 'active' 
  },
  provider: { 
    type: String, 
    enum: ['setu', 'finbox'], 
    required: true 
  },
  accessToken: { type: String },
  refreshToken: { type: String },
  tokenExpiry: { type: Date },
  lastSynced: { type: Date },
  syncErrors: [{
    timestamp: { type: Date, required: true },
    error: { type: String, required: true },
    retryCount: { type: Number, default: 0 }
  }],
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

BankConnectionSchema.index({ userId: 1, status: 1 });
BankConnectionSchema.index({ userId: 1, bankId: 1 }, { unique: true });

export default mongoose.model<IBankConnection>('BankConnection', BankConnectionSchema);
