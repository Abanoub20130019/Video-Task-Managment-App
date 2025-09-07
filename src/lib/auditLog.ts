import { NextRequest } from 'next/server';
import AuditLog from '@/models/AuditLog';
import { dbLogger } from './logger';

interface AuditLogData {
  entityType: 'task' | 'project' | 'user' | 'client' | 'equipment' | 'budget';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'assignment_change';
  userId: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  metadata?: {
    ip?: string;
    userAgent?: string;
    reason?: string;
  };
}

// Create audit log entry
export async function createAuditLog(data: AuditLogData, request?: NextRequest): Promise<void> {
  try {
    const metadata = {
      ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || 'unknown',
      userAgent: request?.headers.get('user-agent') || 'unknown',
      timestamp: new Date(),
      ...data.metadata,
    };

    await AuditLog.create({
      ...data,
      metadata,
    });

    dbLogger.info('Audit log created', {
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
      userId: data.userId,
      changesCount: data.changes.length,
    });
  } catch (error) {
    dbLogger.error('Failed to create audit log', error, {
      entityType: data.entityType,
      entityId: data.entityId,
      action: data.action,
    });
  }
}

// Compare objects and generate change log
export function generateChangeLog(oldData: any, newData: any, excludeFields: string[] = []): Array<{
  field: string;
  oldValue: any;
  newValue: any;
}> {
  const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
  const fieldsToExclude = new Set([...excludeFields, '_id', '__v', 'createdAt', 'updatedAt']);

  // Check for changes in newData
  for (const [key, newValue] of Object.entries(newData)) {
    if (fieldsToExclude.has(key)) continue;

    const oldValue = oldData[key];
    
    // Handle different types of comparisons
    if (isValueChanged(oldValue, newValue)) {
      changes.push({
        field: key,
        oldValue: formatValue(oldValue),
        newValue: formatValue(newValue),
      });
    }
  }

  return changes;
}

// Check if value has actually changed
function isValueChanged(oldValue: any, newValue: any): boolean {
  // Handle null/undefined
  if (oldValue == null && newValue == null) return false;
  if (oldValue == null || newValue == null) return true;

  // Handle dates
  if (oldValue instanceof Date && newValue instanceof Date) {
    return oldValue.getTime() !== newValue.getTime();
  }
  
  if (oldValue instanceof Date || newValue instanceof Date) {
    return new Date(oldValue).getTime() !== new Date(newValue).getTime();
  }

  // Handle objects (shallow comparison)
  if (typeof oldValue === 'object' && typeof newValue === 'object') {
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }

  // Handle primitive values
  return oldValue !== newValue;
}

// Format value for logging
function formatValue(value: any): any {
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  if (typeof value === 'object' && value !== null) {
    // For ObjectId, return string representation
    if (value.toString && typeof value.toString === 'function') {
      return value.toString();
    }
    return value;
  }
  
  return value;
}

// Audit log middleware for API routes
export function withAuditLog(
  entityType: AuditLogData['entityType'],
  action: AuditLogData['action']
) {
  return (handler: (request: NextRequest, auditData: Partial<AuditLogData>) => Promise<any>) => {
    return async (request: NextRequest) => {
      const auditData: Partial<AuditLogData> = {
        entityType,
        action,
      };

      return handler(request, auditData);
    };
  };
}

// Specific audit log functions for common operations
export class TaskAuditLogger {
  static async logTaskCreated(taskId: string, userId: string, taskData: any, request?: NextRequest) {
    await createAuditLog({
      entityType: 'task',
      entityId: taskId,
      action: 'create',
      userId,
      changes: Object.entries(taskData).map(([field, value]) => ({
        field,
        oldValue: null,
        newValue: formatValue(value),
      })),
    }, request);
  }

  static async logTaskUpdated(
    taskId: string, 
    userId: string, 
    oldData: any, 
    newData: any, 
    request?: NextRequest,
    reason?: string
  ) {
    const changes = generateChangeLog(oldData, newData);
    
    if (changes.length > 0) {
      await createAuditLog({
        entityType: 'task',
        entityId: taskId,
        action: 'update',
        userId,
        changes,
        metadata: { reason },
      }, request);
    }
  }

  static async logTaskDeleted(taskId: string, userId: string, taskData: any, request?: NextRequest) {
    await createAuditLog({
      entityType: 'task',
      entityId: taskId,
      action: 'delete',
      userId,
      changes: Object.entries(taskData).map(([field, value]) => ({
        field,
        oldValue: formatValue(value),
        newValue: null,
      })),
    }, request);
  }

  static async logStatusChange(
    taskId: string, 
    userId: string, 
    oldStatus: string, 
    newStatus: string, 
    request?: NextRequest
  ) {
    await createAuditLog({
      entityType: 'task',
      entityId: taskId,
      action: 'status_change',
      userId,
      changes: [{
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
      }],
    }, request);
  }

  static async logAssignmentChange(
    taskId: string, 
    userId: string, 
    oldAssignee: string, 
    newAssignee: string, 
    request?: NextRequest
  ) {
    await createAuditLog({
      entityType: 'task',
      entityId: taskId,
      action: 'assignment_change',
      userId,
      changes: [{
        field: 'assignedTo',
        oldValue: oldAssignee,
        newValue: newAssignee,
      }],
    }, request);
  }
}

// Get audit logs for an entity
export async function getAuditLogs(
  entityType: string,
  entityId: string,
  limit: number = 50,
  page: number = 1
) {
  try {
    const skip = (page - 1) * limit;
    
    const logs = await AuditLog.find({ entityType, entityId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AuditLog.countDocuments({ entityType, entityId });

    return {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    dbLogger.error('Failed to fetch audit logs', error, { entityType, entityId });
    return {
      logs: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: limit,
      },
    };
  }
}

// Clean up old audit logs (for maintenance)
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await AuditLog.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    dbLogger.info('Audit log cleanup completed', {
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString(),
    });

    return result.deletedCount || 0;
  } catch (error) {
    dbLogger.error('Audit log cleanup failed', error);
    return 0;
  }
}

export default {
  createAuditLog,
  generateChangeLog,
  getAuditLogs,
  cleanupOldAuditLogs,
  TaskAuditLogger,
};