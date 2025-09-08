import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'project_manager' | 'crew_member';
  avatar?: string;
  bio?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  skills?: string[];
  department?: string;
  lastActive?: Date;
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      digest: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  stats?: {
    projectsCompleted: number;
    tasksCompleted: number;
    hoursLogged: number;
  };
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
  bio: {
    type: String,
    maxlength: 500,
  },
  phone: {
    type: String,
  },
  location: {
    type: String,
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  skills: [{
    type: String,
    trim: true,
  }],
  department: {
    type: String,
    enum: ['production', 'post-production', 'creative', 'technical', 'management'],
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      digest: {
        type: Boolean,
        default: false,
      },
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  stats: {
    projectsCompleted: {
      type: Number,
      default: 0,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    hoursLogged: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Index for faster queries (email index is already created by unique: true)
// UserSchema.index({ email: 1 }); // Removed duplicate index

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);