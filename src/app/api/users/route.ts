import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { userQuerySchema, validateQueryParams } from '@/lib/zodSchemas';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryValidation = validateQueryParams(userQuerySchema, searchParams);
    if (!queryValidation.success) {
      const errors = 'errors' in queryValidation ? queryValidation.errors : ['Validation failed'];
      return NextResponse.json(
        { error: 'Invalid query parameters', details: errors },
        { status: 400 }
      );
    }

    const { page, limit, search, role } = queryValidation.data as any;
    const skip = (page - 1) * limit;

    await dbConnect();

    let query: any = {};
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination metadata
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query, 'name email role createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance

    return NextResponse.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalUsers,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}