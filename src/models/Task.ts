import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  startDate?: Date;
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'completed'],
    default: 'todo',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  startDate: {
    type: Date,
    required: false,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  estimatedHours: {
    type: Number,
    default: 0,
  },
  actualHours: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ startDate: 1 });
TaskSchema.index({ dueDate: 1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);