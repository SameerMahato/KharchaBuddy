import mongoose, { Schema, Document } from 'mongoose';

export interface ITrustFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface ITrustEvent {
  timestamp: Date;
  type: string;
  impact: number;
}

export interface ITrustScore extends Document {
  userId: string;
  friendId: string;
  score: number;
  factors: ITrustFactor[];
  history: ITrustEvent[];
  reliability: 'excellent' | 'good' | 'fair' | 'poor';
  lastCalculated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrustFactorSchema = new Schema<ITrustFactor>({
  factor: { type: String, required: true },
  impact: { type: Number, required: true },
  description: { type: String, required: true }
});

const TrustEventSchema = new Schema<ITrustEvent>({
  timestamp: { type: Date, required: true },
  type: { type: String, required: true },
  impact: { type: Number, required: true }
});

const TrustScoreSchema = new Schema<ITrustScore>({
  userId: { type: String, required: true, index: true },
  friendId: { type: String, required: true, index: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  factors: [TrustFactorSchema],
  history: [TrustEventSchema],
  reliability: { 
    type: String, 
    enum: ['excellent', 'good', 'fair', 'poor'], 
    required: true 
  },
  lastCalculated: { type: Date, required: true }
}, {
  timestamps: true
});

TrustScoreSchema.index({ userId: 1, friendId: 1 }, { unique: true });

export default mongoose.model<ITrustScore>('TrustScore', TrustScoreSchema);
