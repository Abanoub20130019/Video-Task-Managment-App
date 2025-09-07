import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
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

    const tasks = await Task.find(query)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(tasks);
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

    const { projectId, title, description, assignedTo, priority, dueDate, estimatedHours } = await request.json();

    // Validate required fields
    if (!projectId || !title || !assignedTo || !dueDate) {
      return NextResponse.json(
        { error: 'Project, title, assigned user, and due date are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const task = await Task.create({
      projectId,
      title,
      description,
      assignedTo,
      priority: priority || 'medium',
      dueDate,
      estimatedHours: estimatedHours || 0,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'name')
      .populate('assignedTo', 'name email');

    return NextResponse.json(populatedTask, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}