import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

// Helper function for password hashing (same as in seed.ts)
const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, { N: 1024 }, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
};

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Delete existing admin user
    await User.deleteOne({ email: 'admin@example.com' });
    
    // Create new admin user with correct password hash
    const adminPassword = await hashPassword('Admin123!@#');
    
    const adminUser = await User.create({
      name: 'John Doe',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
    });
    
    console.log('Admin user created successfully:', {
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin user fixed successfully',
      user: {
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });
    
  } catch (error) {
    console.error('Fix admin error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fix admin user',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}