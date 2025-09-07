import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';

// Ensure models are registered by importing them
// This prevents the MissingSchemaError during populate operations
const ensureModelsRegistered = () => {
  // Force model registration by calling mongoose.model() explicitly
  if (!mongoose.models.Comment) mongoose.model('Comment', Comment.schema);
  if (!mongoose.models.User) mongoose.model('User', User.schema);
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const projectId = searchParams.get('projectId');

    if (!taskId && !projectId) {
      return NextResponse.json(
        { error: 'Either taskId or projectId must be provided' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Ensure all models are registered before populate operations
    ensureModelsRegistered();

    const query = taskId ? { taskId } : { projectId };

    const comments = await Comment.find(query)
      .populate('author', 'name email')
      .sort({ createdAt: 1 });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
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

    const { content, taskId, projectId } = await request.json();

    if (!content || (!taskId && !projectId)) {
      return NextResponse.json(
        { error: 'Content and either taskId or projectId are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Ensure all models are registered before database operations
    ensureModelsRegistered();

    const comment = await Comment.create({
      content,
      author: session.user.id,
      taskId,
      projectId,
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email');

    return NextResponse.json(populatedComment, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}