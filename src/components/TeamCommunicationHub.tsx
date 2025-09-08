'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { showError, showSuccess } from '@/lib/toast';
import Pusher from 'pusher-js';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: string;
  type: 'text' | 'file' | 'mention' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mentions?: string[];
  replyTo?: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> userIds
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  role: string;
  lastSeen?: string;
}

interface TeamCommunicationHubProps {
  projectId?: string;
  taskId?: string;
  channelType?: 'project' | 'task' | 'general';
}

export default function TeamCommunicationHub({
  projectId,
  taskId,
  channelType = 'general'
}: TeamCommunicationHubProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const channelName = `chat-${channelType}-${projectId || taskId || 'general'}`;

  useEffect(() => {
    if (session?.user?.id) {
      initializeChat();
      setupRealtimeConnection();
    }

    return () => {
      if (channelRef.current) {
        pusherRef.current?.unsubscribe(channelName);
      }
      pusherRef.current?.disconnect();
    };
  }, [session?.user?.id, channelName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Fetch chat history
      const messagesResponse = await fetch(`/api/chat/${channelName}/messages`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);
      }

      // Fetch team members
      const membersResponse = await fetch(`/api/chat/${channelName}/members`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setTeamMembers(membersData.members || []);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const setupRealtimeConnection = () => {
    pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: '/api/pusher/auth',
    });

    const channel = pusherRef.current.subscribe(`presence-${channelName}`);
    channelRef.current = channel;

    // Handle presence events
    channel.bind('pusher:subscription_succeeded', (members: any) => {
      setOnlineUsers(Object.keys(members.members));
    });

    channel.bind('pusher:member_added', (member: any) => {
      setOnlineUsers(prev => [...prev, member.id]);
    });

    channel.bind('pusher:member_removed', (member: any) => {
      setOnlineUsers(prev => prev.filter(id => id !== member.id));
    });

    // Handle chat events
    channel.bind('new-message', (data: ChatMessage) => {
      setMessages(prev => [...prev, data]);
    });

    channel.bind('user-typing', (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId !== session?.user?.id) {
        setIsTyping(prev => 
          data.isTyping 
            ? [...prev.filter(id => id !== data.userId), data.userId]
            : prev.filter(id => id !== data.userId)
        );
      }
    });

    channel.bind('message-reaction', (data: { messageId: string; emoji: string; userId: string; action: 'add' | 'remove' }) => {
      setMessages(prev => prev.map(msg => {
        if (msg.id === data.messageId) {
          const reactions = { ...msg.reactions };
          if (!reactions[data.emoji]) reactions[data.emoji] = [];
          
          if (data.action === 'add') {
            if (!reactions[data.emoji].includes(data.userId)) {
              reactions[data.emoji].push(data.userId);
            }
          } else {
            reactions[data.emoji] = reactions[data.emoji].filter(id => id !== data.userId);
            if (reactions[data.emoji].length === 0) {
              delete reactions[data.emoji];
            }
          }
          
          return { ...msg, reactions };
        }
        return msg;
      }));
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!session?.user?.id) return;

    try {
      let fileUrls: { url: string; name: string; size: number }[] = [];

      // Upload files if any
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));

        const uploadResponse = await fetch('/api/chat/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          fileUrls = uploadData.files;
        }
      }

      // Extract mentions
      const mentions = extractMentions(newMessage);

      const messageData = {
        message: newMessage.trim(),
        type: fileUrls.length > 0 ? 'file' : 'text',
        fileUrl: fileUrls[0]?.url,
        fileName: fileUrls[0]?.name,
        fileSize: fileUrls[0]?.size,
        mentions,
        replyTo: replyingTo?.id,
        channelName,
      };

      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedFiles([]);
        setReplyingTo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (error) {
      showError('Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedUser = teamMembers.find(member => 
        member.name.toLowerCase().includes(match[1].toLowerCase())
      );
      if (mentionedUser) {
        mentions.push(mentionedUser.id);
      }
    }
    
    return mentions;
  };

  const handleTyping = () => {
    if (channelRef.current && session?.user) {
      channelRef.current.trigger('client-typing', {
        userId: session.user.id,
        userName: session.user.name,
        isTyping: true,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.trigger('client-typing', {
          userId: session.user.id,
          userName: session.user.name,
          isTyping: false,
        });
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/chat/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
          action: 'add',
          channelName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }
    } catch (error) {
      showError('Failed to add reaction');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      online: 'bg-green-400',
      away: 'bg-yellow-400',
      busy: 'bg-red-400',
      offline: 'bg-gray-400'
    };
    return colors[status as keyof typeof colors] || colors.offline;
  };

  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀'];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg h-96 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team Chat
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {channelType === 'project' ? 'Project Discussion' : 
               channelType === 'task' ? 'Task Discussion' : 'General Chat'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 4).map(member => (
                <div key={member.id} className="relative">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                    <span className="text-xs font-bold text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                    onlineUsers.includes(member.id) ? getStatusColor(member.status) : 'bg-gray-400'
                  }`}></div>
                </div>
              ))}
              {teamMembers.length > 4 && (
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                  <span className="text-xs font-bold text-white">+{teamMembers.length - 4}</span>
                </div>
              )}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {onlineUsers.length} online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="group">
            {/* Reply indicator */}
            {message.replyTo && (
              <div className="ml-12 mb-1 text-xs text-gray-500 dark:text-gray-400 border-l-2 border-gray-300 dark:border-slate-600 pl-2">
                Replying to previous message
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {message.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {message.userName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                
                <div className="mt-1">
                  {message.type === 'file' ? (
                    <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 7a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V7zM5 9a1 1 0 000 2h6a1 1 0 100-2H5z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {message.fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}
                          </p>
                        </div>
                      </div>
                      {message.fileUrl && (
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2 block"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {message.message}
                    </p>
                  )}
                  
                  {message.message && message.type === 'file' && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {message.message}
                    </p>
                  )}
                </div>

                {/* Reactions */}
                {message.reactions && Object.keys(message.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(message.reactions).map(([emoji, userIds]) => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(message.id, emoji)}
                        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                          userIds.includes(session?.user?.id || '')
                            ? 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{userIds.length}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Quick actions (visible on hover) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setReplyingTo(message)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Reply
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        React
                      </button>
                      {showEmojiPicker === message.id && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg p-2 z-10">
                          <div className="flex space-x-1">
                            {commonEmojis.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  addReaction(message.id, emoji);
                                  setShowEmojiPicker(null);
                                }}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicators */}
        {isTyping.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {isTyping.length === 1 
                ? `Someone is typing...` 
                : `${isTyping.length} people are typing...`
              }
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Replying to {replyingTo.userName}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        {selectedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-1 text-sm flex items-center space-x-2">
                <span>{file.name}</span>
                <button
                  onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={messageInputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                setSelectedFiles(Array.from(e.target.files));
              }
            }}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}