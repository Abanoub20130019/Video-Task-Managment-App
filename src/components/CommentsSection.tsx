'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Comment {
  _id: string;
  content: string;
  author: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface CommentsSectionProps {
  taskId?: string;
  projectId?: string;
}

export default function CommentsSection({ taskId, projectId }: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

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
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          taskId,
          projectId,
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>

      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
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
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {comment.author.name}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      {session && (
        <form onSubmit={handleSubmit} className="border-t pt-4">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !newComment.trim()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
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