import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
  },
}, {
  timestamps: true,
});

// Ensure either taskId or projectId is provided
CommentSchema.pre('save', function(next) {
  if (!this.taskId && !this.projectId) {
    next(new Error('Either taskId or projectId must be provided'));
  }
  next();
});

// Indexes
CommentSchema.index({ taskId: 1, createdAt: -1 });
CommentSchema.index({ projectId: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);