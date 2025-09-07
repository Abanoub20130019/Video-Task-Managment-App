import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow this in development or with a specific debug key
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!isDev) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const mongoUri = process.env.MONGODB_URI;
    
    // Mask the password for security
    const maskedUri = mongoUri 
      ? mongoUri.replace(/:([^:@]+)@/, ':***@')
      : 'Not set';

    return NextResponse.json({
      status: 'debug',
      environment: process.env.NODE_ENV,
      mongoUri: maskedUri,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriLength: process.env.MONGODB_URI?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug env error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to get environment info',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}