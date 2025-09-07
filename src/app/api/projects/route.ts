import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Client from '@/models/Client';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { projectQuerySchema, createProjectSchema, validateRequestData, validateQueryParams } from '@/lib/zodSchemas';

// Ensure models are registered by importing them
// This prevents the MissingSchemaError during populate operations
const ensureModelsRegistered = () => {
  // Force model registration by calling mongoose.model() explicitly
  if (!mongoose.models.Project) mongoose.model('Project', Project.schema);
  if (!mongoose.models.Client) mongoose.model('Client', Client.schema);
  if (!mongoose.models.User) mongoose.model('User', User.schema);
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = validateQueryParams(projectQuerySchema, searchParams);
    if (!queryValidation.success) {
      const errors = 'errors' in queryValidation ? queryValidation.errors : ['Validation failed'];
      return NextResponse.json(
        { error: 'Invalid query parameters', details: errors },
        { status: 400 }
      );
    }

    const { page, limit, search, status, clientId } = queryValidation.data;
    const skip = (page - 1) * limit;

    await dbConnect();
    
    // Ensure all models are registered before populate operations
    ensureModelsRegistered();

    let query: any = {};
    if (status) {
      query.status = status;
    }
    if (clientId) {
      query.clientId = clientId;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination metadata
    const totalProjects = await Project.countDocuments(query);
    const totalPages = Math.ceil(totalProjects / limit);

    const projects = await (Project as any).find(query)
      .populate({
        path: 'clientId',
        select: 'name email',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'projectManagerId',
        select: 'name email',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    return NextResponse.json({
      projects: projects || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalProjects,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's a MongoDB connection error
    if (error instanceof Error && error.message.includes('MongoServerError')) {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
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
    const validation = validateRequestData(createProjectSchema, requestData);
    if (!validation.success) {
      const errors = 'errors' in validation ? validation.errors : ['Validation failed'];
      return NextResponse.json(
        { error: 'Invalid project data', details: errors },
        { status: 400 }
      );
    }

    if (!validation.success) {
      // This should never happen since we already checked above, but TypeScript needs this
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const { name, description, clientId, projectManagerId, budget, startDate, endDate, status } = validation.data as any;

    await dbConnect();
    
    // Ensure all models are registered before database operations
    ensureModelsRegistered();

    const project = await (Project as any).create({
      name,
      description,
      clientId,
      projectManagerId,
      budget,
      startDate,
      endDate,
      status,
    });

    const populatedProject = await (Project as any).findById(project._id)
      .populate('clientId', 'name email')
      .populate('projectManagerId', 'name email');

    return NextResponse.json(populatedProject, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}