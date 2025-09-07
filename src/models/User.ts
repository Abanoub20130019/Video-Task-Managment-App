import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'project_manager' | 'crew_member';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'project_manager', 'crew_member'],
    default: 'crew_member',
  },
  avatar: {
    type: String,
  },
}, {
  timestamps: true,
});

// Index for faster queries
UserSchema.index({ email: 1 });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);