import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

// Helper function for password comparison (same as in auth.ts)
const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const [saltHex, keyHex] = hash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const key = Buffer.from(keyHex, 'hex');
    crypto.scrypt(password, salt, 64, { N: 1024 }, (err, derivedKey) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(key, derivedKey));
    });
  });
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    console.log('Admin user found:', {
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      passwordHash: adminUser.password.substring(0, 20) + '...' // Show first 20 chars for debugging
    });

    // Test password comparison
    const testPassword = 'Admin123!@#';
    const isValid = await comparePassword(testPassword, adminUser.password);
    
    console.log('Password test result:', isValid);

    return NextResponse.json({
      success: true,
      userFound: true,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      passwordHashPreview: adminUser.password.substring(0, 20) + '...',
      passwordTestResult: isValid,
      testPassword: testPassword
    });

  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}