import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: This endpoint is disabled in production for security reasons
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint disabled in production' },
      { status: 404 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    // Require authentication and admin role
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Debug endpoint available only in development',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: This endpoint is disabled in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seeding disabled in production' },
      { status: 404 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: 'Seeding available only in development with admin access'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Seeding failed'
    }, { status: 500 });
  }
}