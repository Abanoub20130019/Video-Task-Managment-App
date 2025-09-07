import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  entityType: 'task' | 'project' | 'user' | 'client' | 'equipment' | 'budget';
  entityId: mongoose.Types.ObjectId;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'assignment_change';
  userId: mongoose.Types.ObjectId;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata: {
    ip?: string;
    userAgent?: string;
    timestamp: Date;
    reason?: string;
  };
  createdAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  entityType: {
    type: String,
    enum: ['task', 'project', 'user', 'client', 'equipment', 'budget'],
    required: true,
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'status_change', 'assignment_change'],
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  changes: [{
    field: {
      type: String,
      required: true,
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
  }],
  metadata: {
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reason: String,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ 'metadata.timestamp': -1 });

// Compound indexes for common queries
AuditLogSchema.index({ entityType: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ entityId: 1, createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);