import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule extends Document {
  projectId: mongoose.Types.ObjectId;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  assignedResources: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema: Schema = new Schema({
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
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    trim: true,
  },
  assignedResources: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

// Indexes
ScheduleSchema.index({ projectId: 1 });
ScheduleSchema.index({ startDate: 1 });
ScheduleSchema.index({ endDate: 1 });

export default mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);