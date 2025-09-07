import { NextResponse } from 'next/server';
import dbConnect, { testConnection } from '@/lib/mongodb';

export async function GET() {
  try {
    // Test the connection
    const result = await testConnection();

    if (result.success) {
      // Also try to get some basic info
      const mongoose = await dbConnect();
      const dbName = mongoose.connection.db.databaseName;
      const collections = await mongoose.connection.db.listCollections().toArray();

      return NextResponse.json({
        status: 'success',
        message: result.message,
        database: dbName,
        collectionsCount: collections.length,
        collections: collections.map((col: any) => col.name),
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'error',
        message: result.message,
        error: result.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test DB API error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}