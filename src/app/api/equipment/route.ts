import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Equipment from '@/models/Equipment';
import { authOptions } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const equipment = await Equipment.find().sort({ name: 1 });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Get equipment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, availability, location, maintenanceSchedule } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const equipment = await Equipment.create({
      name,
      type,
      availability: availability !== undefined ? availability : true,
      location,
      maintenanceSchedule,
    });

    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error('Create equipment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}