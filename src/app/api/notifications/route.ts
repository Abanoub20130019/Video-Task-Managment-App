import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Task from '@/models/Task';
import Project from '@/models/Project';
import { authOptions } from '@/lib/auth';

// Ensure models are registered by importing them
// This prevents the MissingSchemaError during populate operations
const ensureModelsRegistered = () => {
  // Force model registration by accessing the imported models
  // This ensures they are loaded and registered with Mongoose
  Task;
  Project;
};

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Ensure all models are registered before populate operations
    ensureModelsRegistered();

    // Get tasks assigned to the user that are due soon or overdue
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const urgentTasks = await Task.find({
      assignedTo: session.user.id,
      dueDate: { $lte: threeDaysFromNow },
      status: { $ne: 'completed' },
    })
      .populate('projectId', 'name')
      .sort({ dueDate: 1 });

    const notifications = urgentTasks.map(task => {
      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate < now;
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: task._id,
        type: isOverdue ? 'overdue' : 'due_soon',
        title: isOverdue ? 'Task Overdue' : 'Task Due Soon',
        message: `${task.title} in ${task.projectId.name} is ${isOverdue ? 'overdue' : `due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`}`,
        taskId: task._id,
        projectId: task.projectId._id,
        dueDate: task.dueDate,
        priority: task.priority,
      };
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}