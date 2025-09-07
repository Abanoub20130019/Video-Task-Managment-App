import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import Project from '@/models/Project';
import User from '@/models/User';
import Client from '@/models/Client';
import { authOptions } from '@/lib/auth';
import { taskQuerySchema, createTaskSchema, validateRequestData, validateQueryParams } from '@/lib/zodSchemas';
import { TaskAuditLogger } from '@/lib/auditLog';
import { apiLogger } from '@/lib/logger';

// Ensure models are registered by importing them
// This prevents the MissingSchemaError during populate operations
const ensureModelsRegistered = () => {
  // Force model registration by calling mongoose.model() explicitly
  if (!mongoose.models.Task) mongoose.model('Task', Task.schema);
  if (!mongoose.models.Project) mongoose.model('Project', Project.schema);
  if (!mongoose.models.User) mongoose.model('User', User.schema);
  if (!mongoose.models.Client) mongoose.model('Client', Client.schema);
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = validateQueryParams(taskQuerySchema, searchParams);
    if (!queryValidation.success) {
      const errors = 'errors' in queryValidation ? queryValidation.errors : ['Validation failed'];
      return NextResponse.json(
        { error: 'Invalid query parameters', details: errors },
        { status: 400 }
      );
    }

    const { page, limit, search, status, priority, projectId } = queryValidation.data as any;
    const skip = (page - 1) * limit;

    await dbConnect();
    
    // Ensure all models are registered before populate operations
    ensureModelsRegistered();

    let query: any = {};
    if (projectId) {
      query.projectId = projectId;
    }
    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination metadata
    const totalTasks = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalTasks / limit);

    const tasks = await Task.find(query)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    return NextResponse.json({
      tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalTasks,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    
    // Validate request data
    const validation = validateRequestData(createTaskSchema, requestData);
    if (!validation.success) {
      const errors = 'errors' in validation ? validation.errors : ['Validation failed'];
      return NextResponse.json(
        { error: 'Invalid task data', details: errors },
        { status: 400 }
      );
    }

    const { projectId, title, description, assignedTo, priority, dueDate, startDate, estimatedHours } = validation.data as any;

    await dbConnect();
    
    // Ensure all models are registered before database operations
    ensureModelsRegistered();

    const task = await Task.create({
      projectId,
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      startDate,
      estimatedHours,
    });

    // Log task creation
    await TaskAuditLogger.logTaskCreated(
      task._id.toString(),
      session.user.id,
      {
        projectId,
        title,
        description,
        assignedTo,
        priority,
        dueDate,
        startDate,
        estimatedHours,
      },
      request
    );

    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email');

    apiLogger.info('Task created successfully', {
      taskId: task._id,
      title,
      projectId,
      assignedTo,
      userId: session.user.id,
    });

    return NextResponse.json(populatedTask, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}