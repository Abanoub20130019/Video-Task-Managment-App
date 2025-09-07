import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';
import Client from '@/models/Client';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await dbConnect();
    
    // Test basic queries
    const projectCount = await Project.countDocuments();
    const clientCount = await Client.countDocuments();
    const userCount = await User.countDocuments();
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counts: {
        projects: projectCount,
        clients: clientCount,
        users: userCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}