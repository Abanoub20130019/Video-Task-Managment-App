import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both JSON and form-encoded data
    let socket_id: string;
    let channel_name: string;

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      socket_id = body.socket_id;
      channel_name = body.channel_name;
    } else {
      // Handle form-encoded data
      const formData = await request.formData();
      socket_id = formData.get('socket_id') as string;
      channel_name = formData.get('channel_name') as string;
    }

    if (!socket_id || !channel_name) {
      return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 });
    }

    // Use type assertion to access the method that exists but isn't in types
    const pusherAny = pusher as any;
    
    // Check if it's a presence channel
    if (channel_name.startsWith('presence-')) {
      // For presence channels
      const authData = pusherAny.authenticate(socket_id, channel_name, {
        user_id: session.user.id as string,
        user_info: {
          username: session.user.name || '',
          email: session.user.email || '',
        },
      });
      return NextResponse.json(authData);
    } else {
      // For private channels
      const authData = pusherAny.authenticate(socket_id, channel_name);
      return NextResponse.json(authData);
    }
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}