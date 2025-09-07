import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Schedule from '@/models/Schedule';
import Project from '@/models/Project';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// Ensure models are registered by importing them
// This prevents the MissingSchemaError during populate operations
const ensureModelsRegistered = () => {
  // Force model registration by accessing the imported models
  // This ensures they are loaded and registered with Mongoose
  Schedule;
  Project;
  User;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Ensure all models are registered before populate operations
    ensureModelsRegistered();

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

    // Ensure all models are registered before database operations
    ensureModelsRegistered();

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