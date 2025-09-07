import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import { authOptions } from '@/lib/auth';
import { validateProjectData, createErrorResponse, sanitizeObject } from '@/lib/validation';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const projects = await Project.find()
      .populate('clientId', 'name email')
      .populate('projectManagerId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawData = await request.json();
    const data = sanitizeObject(rawData);

    // Validate data
    const validationErrors = validateProjectData(data);
    if (validationErrors.length > 0) {
      return createErrorResponse(validationErrors);
    }

    const { name, description, clientId, projectManagerId, budget, startDate, endDate, status } = data;

    await dbConnect();

    const project = await Project.create({
      name,
      description,
      clientId,
      projectManagerId,
      budget: budget || 0,
      startDate,
      endDate,
      status: status || 'planning',
    });

    const populatedProject = await Project.findById(project._id)
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