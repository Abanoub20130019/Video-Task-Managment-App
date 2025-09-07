'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import { useRealtimeProject } from '@/lib/realtime';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  mentions: Array<{
    userId: string;
    userName: string;
    startIndex: number;
    endIndex: number;
  }>;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
}

interface EnhancedCommentsSectionProps {
  taskId?: string;
  projectId?: string;
  users?: User[];
}

export default function EnhancedCommentsSection({ taskId, projectId, users = [] }: EnhancedCommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ start: 0, end: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Real-time updates
  const { onlineUsers } = useRealtimeProject(projectId || '');

  useEffect(() => {
    if (taskId || projectId) {
      fetchComments();
    }
  }, [taskId, projectId]);

  const fetchComments = async () => {
    try {
      const params = new URLSearchParams();
      if (taskId) params.append('taskId', taskId);
      if (projectId) params.append('projectId', projectId);

      const response = await fetch(`/api/comments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      showError('Failed to load comments');
    }
  };

  // Parse @mentions in text
  const parseMentions = (text: string): Array<{ userId: string; userName: string; startIndex: number; endIndex: number }> => {
    const mentions: Array<{ userId: string; userName: string; startIndex: number; endIndex: number }> = [];
    const mentionRegex = /@(\w+)/g;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionedName = match[1];
      const user = users.find(u => 
        u.name.toLowerCase().includes(mentionedName.toLowerCase()) ||
        u.email.toLowerCase().includes(mentionedName.toLowerCase())
      );

      if (user) {
        mentions.push({
          userId: user._id,
          userName: user.name,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    }

    return mentions;
  };

  // Handle @mention input
  const handleTextChange = (text: string, isEdit = false) => {
    if (isEdit) {
      setEditContent(text);
    } else {
      setNewComment(text);
    }

    // Check for @mention trigger
    const textarea = isEdit ? editTextareaRef.current : textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Check if we're in a mention (no spaces after @)
      if (!textAfterAt.includes(' ') && textAfterAt.length >= 0) {
        setMentionQuery(textAfterAt);
        setMentionPosition({ start: lastAtIndex, end: cursorPosition });
        setShowMentions(true);
        setSelectedMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Filter users for mentions
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5);

  // Insert mention
  const insertMention = (user: User, isEdit = false) => {
    const currentText = isEdit ? editContent : newComment;
    const beforeMention = currentText.substring(0, mentionPosition.start);
    const afterMention = currentText.substring(mentionPosition.end);
    const newText = `${beforeMention}@${user.name} ${afterMention}`;

    if (isEdit) {
      setEditContent(newText);
    } else {
      setNewComment(newText);
    }

    setShowMentions(false);
    setMentionQuery('');

    // Focus back to textarea
    setTimeout(() => {
      const textarea = isEdit ? editTextareaRef.current : textareaRef.current;
      if (textarea) {
        const newCursorPosition = mentionPosition.start + user.name.length + 2;
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  // Handle keyboard navigation in mentions
  const handleMentionKeyDown = (e: React.KeyboardEvent, isEdit = false) => {
    if (!showMentions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMentionIndex(prev => Math.min(prev + 1, filteredUsers.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (filteredUsers[selectedMentionIndex]) {
          insertMention(filteredUsers[selectedMentionIndex], isEdit);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowMentions(false);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const mentions = parseMentions(newComment);
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          taskId,
          projectId,
          mentions,
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment('');
        showSuccess('Comment added successfully');

        // Send notifications to mentioned users
        if (mentions.length > 0) {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'mention',
              userIds: mentions.map(m => m.userId),
              message: `${session?.user?.name} mentioned you in a comment`,
              entityType: taskId ? 'task' : 'project',
              entityId: taskId || projectId,
            }),
          });
        }
      } else {
        showError('Failed to add comment');
      }
    } catch (error) {
      showError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const mentions = parseMentions(editContent);
      
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editContent,
          mentions,
        }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(prev => prev.map(c => c._id === commentId ? updatedComment : c));
        setEditingComment(null);
        setEditContent('');
        showSuccess('Comment updated');
      } else {
        showError('Failed to update comment');
      }
    } catch (error) {
      showError('Failed to update comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(prev => prev.filter(c => c._id !== commentId));
        showSuccess('Comment deleted');
      } else {
        showError('Failed to delete comment');
      }
    } catch (error) {
      showError('Failed to delete comment');
    }
  };

  // Render comment content with highlighted mentions
  const renderCommentContent = (content: string, mentions: Comment['mentions'] = []) => {
    if (mentions.length === 0) {
      return <span>{content}</span>;
    }

    const parts = [];
    let lastIndex = 0;

    mentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {content.substring(lastIndex, mention.startIndex)}
          </span>
        );
      }

      // Add mention
      parts.push(
        <span
          key={`mention-${index}`}
          className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-1 py-0.5 rounded font-medium"
          title={`Mentioned user: ${mention.userName}`}
        >
          @{mention.userName}
        </span>
      );

      lastIndex = mention.endIndex;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="text-end">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  };

  return (
    <div className="bg-white dark:bg-slate-900 shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Comments</h3>
        {onlineUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-slate-400">
            <div className="flex -space-x-1">
              {onlineUsers.slice(0, 3).map((user) => (
                <div
                  key={user.userId}
                  className="w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs"
                  title={user.userName}
                >
                  {user.userName.charAt(0)}
                </div>
              ))}
            </div>
            <span>{onlineUsers.length} online</span>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {comment.author.name}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {new Date(comment.createdAt).toLocaleString()}
                      {comment.isEdited && ' (edited)'}
                    </span>
                  </div>
                  {session?.user?.id === comment.author._id && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingComment(comment._id);
                          setEditContent(comment.content);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {editingComment === comment._id ? (
                  <div className="mt-2 relative">
                    <textarea
                      ref={editTextareaRef}
                      value={editContent}
                      onChange={(e) => handleTextChange(e.target.value, true)}
                      onKeyDown={(e) => handleMentionKeyDown(e, true)}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                      rows={3}
                      placeholder="Edit your comment... Use @username to mention someone"
                    />
                    
                    {/* Mention dropdown for edit */}
                    {showMentions && filteredUsers.length > 0 && (
                      <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {filteredUsers.map((user, index) => (
                          <button
                            key={user._id}
                            onClick={() => insertMention(user, true)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${
                              index === selectedMentionIndex ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-slate-100">{user.name}</div>
                                <div className="text-xs text-gray-500 dark:text-slate-400">{user.email}</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleEdit(comment._id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent('');
                          setShowMentions(false);
                        }}
                        className="px-3 py-1 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-700 dark:text-slate-300 mt-1">
                    {renderCommentContent(comment.content, comment.mentions)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      {session && (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => handleTextChange(e.target.value)}
                onKeyDown={handleMentionKeyDown}
                placeholder="Add a comment... Use @username to mention someone"
                className="w-full border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
                rows={3}
              />

              {/* Mention dropdown */}
              {showMentions && filteredUsers.length > 0 && (
                <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredUsers.map((user, index) => (
                    <button
                      key={user._id}
                      onClick={() => insertMention(user)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${
                        index === selectedMentionIndex ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-slate-100">{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-2 flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-slate-400">
                  Type @ to mention users • Shift+Enter for new line
                </div>
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

// Hook for managing comment mentions
export function useCommentMentions(users: User[]) {
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchMentions = (query: string) => {
    if (!query) {
      setMentionSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    setMentionSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  return {
    mentionSuggestions,
    showSuggestions,
    searchMentions,
    hideSuggestions: () => setShowSuggestions(false),
  };
}

// Notification for mentions
export function MentionNotification({ 
  mention, 
  onDismiss 
}: { 
  mention: { 
    id: string;
    message: string;
    author: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  };
  onDismiss: () => void;
}) {
  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
            You were mentioned
          </h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
            {mention.message}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
            {new Date(mention.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}