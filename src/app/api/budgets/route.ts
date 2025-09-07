import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Budget from '@/models/Budget';
import Project from '@/models/Project';
import { authOptions } from '@/lib/auth';

// Ensure models are registered by importing them
// This prevents the MissingSchemaError during populate operations
const ensureModelsRegistered = () => {
  // Force model registration by calling mongoose.model() explicitly
  if (!mongoose.models.Budget) mongoose.model('Budget', Budget.schema);
  if (!mongoose.models.Project) mongoose.model('Project', Project.schema);
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

    let query = {};
    if (projectId) {
      query = { projectId };
    }

    const budgets = await Budget.find(query)
      .populate('projectId', 'name')
      .sort({ createdAt: 1 });

    return NextResponse.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
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

    const { projectId, category, plannedAmount, actualAmount, description } = await request.json();

    if (!projectId || !category || plannedAmount === undefined) {
      return NextResponse.json(
        { error: 'Project, category, and planned amount are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Ensure all models are registered before database operations
    ensureModelsRegistered();

    const budget = await Budget.create({
      projectId,
      category,
      plannedAmount,
      actualAmount: actualAmount || 0,
      description,
    });

    const populatedBudget = await Budget.findById(budget._id)
      .populate('projectId', 'name');

    return NextResponse.json(populatedBudget, { status: 201 });
  } catch (error) {
    console.error('Create budget error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}