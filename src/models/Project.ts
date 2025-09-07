import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  clientId: mongoose.Types.ObjectId;
  projectManagerId: mongoose.Types.ObjectId;
  crewMembers: mongoose.Types.ObjectId[];
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  budget: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  projectManagerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  crewMembers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed'],
    default: 'planning',
  },
  budget: {
    type: Number,
    default: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ProjectSchema.index({ clientId: 1 });
ProjectSchema.index({ projectManagerId: 1 });
ProjectSchema.index({ crewMembers: 1 });
ProjectSchema.index({ status: 1 });

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);