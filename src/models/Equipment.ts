import mongoose, { Document, Schema } from 'mongoose';

export interface IEquipment extends Document {
  name: string;
  type: string;
  availability: boolean;
  location: string;
  maintenanceSchedule: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    trim: true,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    trim: true,
  },
  maintenanceSchedule: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
EquipmentSchema.index({ type: 1 });
EquipmentSchema.index({ availability: 1 });

export default mongoose.models.Equipment || mongoose.model<IEquipment>('Equipment', EquipmentSchema);