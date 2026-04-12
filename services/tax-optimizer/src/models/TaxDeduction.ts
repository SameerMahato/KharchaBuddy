import mongoose, { Schema, Document } from 'mongoose';

export interface ITaxDeduction extends Document {
  userId: string;
  financialYear: string;
  section: string;
  category: string;
  amount: number;
  date: Date;
  description: string;
  proofDocument?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaxDeductionSchema = new Schema<ITaxDeduction>({
  userId: { type: String, required: true, index: true },
  financialYear: { type: String, required: true, index: true },
  section: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String, default: '' },
  proofDocument: { type: String }
}, {
  timestamps: true
});

TaxDeductionSchema.index({ userId: 1, financialYear: 1, section: 1 });

export default mongoose.model<ITaxDeduction>('TaxDeduction', TaxDeductionSchema);
