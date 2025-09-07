import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ResourceAllocation from '@/models/ResourceAllocation';
import Equipment from '@/models/Equipment';
import Project from '@/models/Project';
import Schedule from '@/models/Schedule';
import User from '@/models/User';
import Client from '@/models/Client';
import { authOptions } from '@/lib/auth';

// Ensure models are registered by importing them
// This prevents the MissingSchemaError during populate operations
const ensureModelsRegistered = () => {
  // Force model registration by accessing the models
  Equipment;
  Project;
  Schedule;
  User;
  Client;
  ResourceAllocation;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    await dbConnect();
    
    // Ensure all models are registered before populate operations
    ensureModelsRegistered();

    let query: any = {};
    if (projectId) {
      query = { projectId };
    }

    const allocations = await (ResourceAllocation as any).find(query)
      .populate('projectId', 'name')
      .populate('scheduleId', 'title')
      .populate('equipmentId', 'name type')
      .populate('userId', 'name email')
      .sort({ allocatedFrom: 1 });

    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Get allocations error:', error);
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

    const { projectId, scheduleId, equipmentId, userId, allocatedFrom, allocatedTo, notes } = await request.json();

    if (!projectId || !allocatedFrom || !allocatedTo || (!equipmentId && !userId)) {
      return NextResponse.json(
        { error: 'Project, allocation dates, and either equipment or user are required' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Ensure all models are registered before database operations
    ensureModelsRegistered();

    const allocation = await (ResourceAllocation as any).create({
      projectId,
      scheduleId,
      equipmentId,
      userId,
      allocatedFrom,
      allocatedTo,
      notes,
    });

    const populatedAllocation = await (ResourceAllocation as any).findById(allocation._id)
      .populate('projectId', 'name')
      .populate('scheduleId', 'title')
      .populate('equipmentId', 'name type')
      .populate('userId', 'name email');

    return NextResponse.json(populatedAllocation, { status: 201 });
  } catch (error) {
    console.error('Create allocation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}