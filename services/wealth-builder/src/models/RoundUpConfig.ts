import mongoose, { Schema, Document } from 'mongoose';

export interface IRoundUpConfig extends Document {
  userId: string;
  enabled: boolean;
  roundUpTo: number;
  maxRoundUpPerTransaction: number;
  destinationGoalId?: string;
  totalSaved: number;
  transactionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoundUpConfigSchema = new Schema<IRoundUpConfig>({
  userId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  roundUpTo: { type: Number, default: 10 },
  maxRoundUpPerTransaction: { type: Number, default: 50 },
  destinationGoalId: { type: String },
  totalSaved: { type: Number, default: 0 },
  transactionCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model<IRoundUpConfig>('RoundUpConfig', RoundUpConfigSchema);
