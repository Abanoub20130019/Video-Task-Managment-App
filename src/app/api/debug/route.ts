import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG API ENDPOINT (NO AUTH) ===');
    
    // Check database connection
    console.log('Attempting database connection...');
    await dbConnect();
    console.log('Database connected successfully');

    // Check if User model is working
    console.log('Testing User model...');
    const userCount = await User.countDocuments({});
    console.log('User count:', userCount);

    // Check if Project model is working
    console.log('Testing Project model...');
    const projectCount = await Project.countDocuments({});
    console.log('Project count:', projectCount);

    // Check for admin user specifically
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    console.log('Admin user exists:', !!adminUser);

    // Test a simple find operation
    console.log('Testing Project.find()...');
    const projects = await Project.find({}).limit(1).lean();
    console.log('Projects found:', projects.length);

    return NextResponse.json({
      success: true,
      userCount,
      projectCount,
      adminUserExists: !!adminUser,
      sampleProjects: projects,
      timestamp: new Date().toISOString(),
      mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
    });

  } catch (error) {
    console.error('=== DEBUG API ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Non-Error object:', error);
    }

    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: {
        type: typeof error,
        constructor: error?.constructor?.name,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== SEEDING DATABASE ===');
    
    const result = await seedDatabase();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to seed database',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}