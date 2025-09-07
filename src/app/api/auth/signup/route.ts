import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { createUserSchema, validateRequestData } from '@/lib/zodSchemas';
import { signupRateLimit } from '@/lib/rateLimit';
import { authLogger } from '@/lib/logger';

// Helper functions for password hashing
const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, { N: 1024 }, (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt.toString('hex') + ':' + derivedKey.toString('hex'));
    });
  });
};

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

export async function POST(request: NextRequest) {
  return signupRateLimit(request, async () => {
    const startTime = Date.now();
    
    try {
      const requestData = await request.json();
      const ip = request.headers.get('x-forwarded-for') || 'unknown';

      authLogger.info('Signup attempt started', { email: requestData.email, ip });

      // Validate input using Zod schema
      const validation = validateRequestData(createUserSchema, requestData);
      if (!validation.success) {
        const errors = 'errors' in validation ? validation.errors : ['Validation failed'];
        authLogger.warn('Signup validation failed', {
          errors,
          email: requestData.email,
          ip
        });
        return NextResponse.json(
          { error: 'Invalid user data', details: errors },
          { status: 400 }
        );
      }

      const { name, email, password, role } = validation.success ? validation.data : { name: '', email: '', password: '', role: 'crew_member' };

      await dbConnect();

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        authLogger.warn('Signup attempt with existing email', { email, ip });
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'crew_member',
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user.toObject();

      const duration = Date.now() - startTime;
      authLogger.info('User created successfully', {
        userId: user._id,
        email,
        role: user.role,
        duration,
        ip
      });

      return NextResponse.json(
        { message: 'User created successfully', user: userWithoutPassword },
        { status: 201 }
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      authLogger.error('Signup error', error, { duration });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}