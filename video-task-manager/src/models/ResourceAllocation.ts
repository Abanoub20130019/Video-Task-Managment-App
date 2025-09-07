import mongoose, { Document, Schema } from 'mongoose';

export interface IResourceAllocation extends Document {
  projectId: mongoose.Types.ObjectId;
  scheduleId?: mongoose.Types.ObjectId;
  equipmentId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  allocatedFrom: Date;
  allocatedTo: Date;
  status: 'allocated' | 'returned' | 'damaged';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceAllocationSchema: Schema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  scheduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Schedule',
  },
  equipmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Equipment',
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  allocatedFrom: {
    type: Date,
    required: true,
  },
  allocatedTo: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['allocated', 'returned', 'damaged'],
    default: 'allocated',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

// Ensure either equipmentId or userId is provided
ResourceAllocationSchema.pre('save', function(next) {
  if (!this.equipmentId && !this.userId) {
    next(new Error('Either equipmentId or userId must be provided'));
  }
  next();
});

// Indexes
ResourceAllocationSchema.index({ projectId: 1 });
ResourceAllocationSchema.index({ equipmentId: 1 });
ResourceAllocationSchema.index({ userId: 1 });
ResourceAllocationSchema.index({ allocatedFrom: 1, allocatedTo: 1 });

export default mongoose.models.ResourceAllocation || mongoose.model<IResourceAllocation>('ResourceAllocation', ResourceAllocationSchema);