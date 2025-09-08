'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Pusher from 'pusher-js';

interface Cursor {
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  lastSeen: number;
}

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CollaborativeEditor({
  documentId,
  initialContent = '',
  onContentChange,
  placeholder = 'Start typing...',
  className = ''
}: CollaborativeEditorProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState(initialContent);
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);
  const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  const getUserColor = useCallback((userId: string) => {
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return userColors[Math.abs(hash) % userColors.length];
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Initialize Pusher
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });

    const channel = pusherRef.current.subscribe(`presence-document-${documentId}`);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', (members: any) => {
      setIsConnected(true);
      const userList = Object.keys(members.members);
      setActiveUsers(userList);
    });

    channel.bind('pusher:member_added', (member: any) => {
      setActiveUsers(prev => [...prev, member.id]);
    });

    channel.bind('pusher:member_removed', (member: any) => {
      setActiveUsers(prev => prev.filter(id => id !== member.id));
      setCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[member.id];
        return newCursors;
      });
    });

    // Listen for content changes
    channel.bind('content-change', (data: { content: string; userId: string; timestamp: number }) => {
      if (data.userId !== session.user.id && data.timestamp > lastUpdateRef.current) {
        setContent(data.content);
        onContentChange?.(data.content);
      }
    });

    // Listen for cursor movements
    channel.bind('cursor-move', (data: { userId: string; userName: string; x: number; y: number }) => {
      if (data.userId !== session.user.id) {
        setCursors(prev => ({
          ...prev,
          [data.userId]: {
            userId: data.userId,
            userName: data.userName,
            userColor: getUserColor(data.userId),
            x: data.x,
            y: data.y,
            lastSeen: Date.now(),
          }
        }));
      }
    });

    return () => {
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(`presence-document-${documentId}`);
      }
      pusherRef.current?.disconnect();
    };
  }, [session?.user?.id, documentId, onContentChange, getUserColor]);

  // Clean up old cursors
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors(prev => {
        const newCursors = { ...prev };
        Object.keys(newCursors).forEach(userId => {
          if (now - newCursors[userId].lastSeen > 5000) { // 5 seconds timeout
            delete newCursors[userId];
          }
        });
        return newCursors;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
    
    const timestamp = Date.now();
    lastUpdateRef.current = timestamp;

    // Broadcast content change
    if (channelRef.current && session?.user?.id) {
      channelRef.current.trigger('client-content-change', {
        content: newContent,
        userId: session.user.id,
        timestamp,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!session?.user?.id || !channelRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    channelRef.current.trigger('client-cursor-move', {
      userId: session.user.id,
      userName: session.user.name,
      x,
      y,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      handleContentChange(newContent);
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className="relative">
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        
        {/* Active Users */}
        {activeUsers.length > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {activeUsers.length - 1} other{activeUsers.length > 2 ? 's' : ''} editing
            </span>
            <div className="flex -space-x-2">
              {activeUsers
                .filter(userId => userId !== session?.user?.id)
                .slice(0, 3)
                .map(userId => (
                  <div
                    key={userId}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: getUserColor(userId) }}
                  >
                    {userId.charAt(0).toUpperCase()}
                  </div>
                ))}
              {activeUsers.length > 4 && (
                <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
                  +{activeUsers.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor Container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onMouseMove={handleMouseMove}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full min-h-[300px] p-4 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none font-mono text-sm leading-relaxed ${className}`}
        />

        {/* Live Cursors */}
        {Object.values(cursors).map(cursor => (
          <div
            key={cursor.userId}
            className="absolute pointer-events-none z-10"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div
              className="w-0.5 h-5 animate-pulse"
              style={{ backgroundColor: cursor.userColor }}
            ></div>
            <div
              className="absolute -top-6 left-0 px-2 py-1 text-xs text-white rounded whitespace-nowrap"
              style={{ backgroundColor: cursor.userColor }}
            >
              {cursor.userName}
            </div>
          </div>
        ))}
      </div>

      {/* Collaboration Features Info */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span>• Real-time collaboration enabled</span>
          <span>• Live cursor tracking</span>
          <span>• Auto-save every change</span>
        </div>
      </div>
    </div>
  );
}