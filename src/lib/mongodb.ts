import mongoose from 'mongoose';
import { dbLogger } from './logger';

// MongoDB Atlas connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Log connection details for debugging (without exposing credentials)
if (process.env.NODE_ENV === 'development') {
  console.log('MongoDB URI configured:', MONGODB_URI.replace(/:([^:@]+)@/, ':***@'));
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      dbLogger.info('Connected to MongoDB Atlas successfully', {
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      });
      return mongoose;
    }).catch((error) => {
      dbLogger.error('MongoDB connection failed', {
        error: error.message,
        code: error.code,
        mongoUri: MONGODB_URI.replace(/:([^:@]+)@/, ':***@')
      });
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    dbLogger.error('MongoDB connection error', e);
    throw e;
  }

  return cached.conn;
}

// Test connection function
export async function testConnection() {
  try {
    dbLogger.info('Testing MongoDB connection...');
    await dbConnect();
    dbLogger.info('MongoDB connection test successful');
    return { success: true, message: 'Connected to MongoDB successfully!' };
  } catch (error) {
    dbLogger.error('MongoDB connection test failed', error);
    return {
      success: false,
      message: 'Failed to connect to MongoDB',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default dbConnect;