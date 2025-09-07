import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import { authOptions } from '@/lib/auth';
import { projectQuerySchema, createProjectSchema, validateRequestData, validateQueryParams } from '@/lib/zodSchemas';

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
      .populate('clientId', 'name email')
      .populate('projectManagerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    return NextResponse.json({
      projects,
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