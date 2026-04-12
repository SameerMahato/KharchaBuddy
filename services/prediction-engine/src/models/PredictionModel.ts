import mongoose, { Schema, Document } from 'mongoose';

export interface IPredictionModel extends Document {
  userId: string;
  modelVersion: string;
  category?: string;
  parameters: {
    algorithm: string;
    hyperparameters: Record<string, any>;
    features: string[];
  };
  trainingDataSize: number;
  lastTrainedAt: Date;
  accuracy: number;
  mae: number;
  rmse: number;
  featureImportance: Array<{
    feature: string;
    importance: number;
    description: string;
  }>;
  cachedPredictions: Array<{
    predictionType: string;
    result: any;
    confidence: number;
    validUntil: Date;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionModelSchema = new Schema<IPredictionModel>({
  userId: { type: String, required: true, index: true },
  modelVersion: { type: String, required: true },
  category: { type: String, index: true },
  parameters: {
    algorithm: { type: String, required: true },
    hyperparameters: { type: Schema.Types.Mixed, required: true },
    features: [{ type: String }]
  },
  trainingDataSize: { type: Number, required: true },
  lastTrainedAt: { type: Date, required: true },
  accuracy: { type: Number, required: true },
  mae: { type: Number, required: true },
  rmse: { type: Number, required: true },
  featureImportance: [{
    feature: { type: String, required: true },
    importance: { type: Number, required: true },
    description: { type: String }
  }],
  cachedPredictions: [{
    predictionType: { type: String, required: true },
    result: { type: Schema.Types.Mixed },
    confidence: { type: Number, required: true },
    validUntil: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

PredictionModelSchema.index({ userId: 1, category: 1 });
PredictionModelSchema.index({ userId: 1, lastTrainedAt: -1 });

export default mongoose.model<IPredictionModel>('PredictionModel', PredictionModelSchema);
