import mongoose, { Document, Schema } from 'mongoose';

export interface IBudget extends Document {
  projectId: mongoose.Types.ObjectId;
  category: string;
  plannedAmount: number;
  actualAmount: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['equipment', 'personnel', 'location', 'post-production', 'marketing', 'travel', 'miscellaneous'],
  },
  plannedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  actualAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  description: {
    type: String,
  },
}, {
  timestamps: true,
});

// Indexes
BudgetSchema.index({ projectId: 1 });
BudgetSchema.index({ category: 1 });

export default mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);