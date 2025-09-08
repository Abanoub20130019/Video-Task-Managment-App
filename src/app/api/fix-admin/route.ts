import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // SECURITY: This endpoint has been permanently disabled for security reasons
  // It previously exposed hardcoded admin credentials which is a critical security vulnerability
  
  return NextResponse.json({
    error: 'This endpoint has been permanently disabled for security reasons',
    message: 'Please use proper user management through the admin interface'
  }, { status: 410 }); // 410 Gone - indicates the resource is no longer available
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint has been permanently disabled for security reasons'
  }, { status: 410 });
}