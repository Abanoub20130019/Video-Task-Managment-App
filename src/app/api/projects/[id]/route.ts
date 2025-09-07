import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Client from '@/models/Client';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// Ensure models are registered by importing them
// This prevents the MissingSchemaError during populate operations
const ensureModelsRegistered = () => {
  // Force model registration by calling mongoose.model() explicitly
  if (!mongoose.models.Project) mongoose.model('Project', Project.schema);
  if (!mongoose.models.Client) mongoose.model('Client', Client.schema);
  if (!mongoose.models.User) mongoose.model('User', User.schema);
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Ensure all models are registered before database operations
    ensureModelsRegistered();

    const { id } = await params;
    const project = await Project.findById(id)
      .populate('clientId', 'name email company')
      .populate('projectManagerId', 'name email');

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, clientId, projectManagerId, budget, startDate, endDate, status, progress } = await request.json();

    await dbConnect();

    // Ensure all models are registered before populate operations
    ensureModelsRegistered();

    const { id } = await params;
    const project = await Project.findByIdAndUpdate(
      id,
      {
        name,
        description,
        clientId,
        projectManagerId,
        budget,
        startDate,
        endDate,
        status,
        progress,
      },
      { new: true }
    )
      .populate('clientId', 'name email company')
      .populate('projectManagerId', 'name email');

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}