import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Schedule from '@/models/Schedule';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const schedules = await Schedule.find()
      .populate('projectId', 'name')
      .populate('assignedResources', 'name email');

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
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

    const { projectId, title, startDate, endDate, location, assignedResources } = await request.json();

    if (!projectId || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Project, title, start date, and end date are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const schedule = await Schedule.create({
      projectId,
      title,
      startDate,
      endDate,
      location,
      assignedResources: assignedResources || [],
    });

    const populatedSchedule = await Schedule.findById(schedule._id)
      .populate('projectId', 'name')
      .populate('assignedResources', 'name email');

    return NextResponse.json(populatedSchedule, { status: 201 });
  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}