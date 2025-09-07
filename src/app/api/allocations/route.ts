import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import ResourceAllocation from '@/models/ResourceAllocation';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    await dbConnect();

    let query = {};
    if (projectId) {
      query = { projectId };
    }

    const allocations = await ResourceAllocation.find(query)
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

    const allocation = await ResourceAllocation.create({
      projectId,
      scheduleId,
      equipmentId,
      userId,
      allocatedFrom,
      allocatedTo,
      notes,
    });

    const populatedAllocation = await ResourceAllocation.findById(allocation._id)
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