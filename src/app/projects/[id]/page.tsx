'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import CommentsSection from '@/components/CommentsSection';
import FileUpload from '@/components/FileUpload';
import GanttChart from '@/components/GanttChart';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  clientId: {
    name: string;
    email: string;
    company: string;
  };
  projectManagerId: {
    name: string;
    email: string;
  };
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: {
    name: string;
    email: string;
  };
  startDate?: string;
  endDate?: string;
}

export default function ProjectDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && params.id) {
      fetchProject();
      fetchTasks();
    }
  }, [session, params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        console.error('Failed to fetch project:', response.status);
        setProject(null);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      setProject(null);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?projectId=${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch tasks:', response.status);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Link
            href="/projects"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Project Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {project.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{project.description}</p>
              <div className="mt-2 flex items-center space-x-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status?.replace('_', ' ') || 'Unknown'}
                </span>
                <span className="text-sm text-gray-500">
                  Client: {project.clientId?.name || 'Unknown'}
                </span>
                <span className="text-sm text-gray-500">
                  Manager: {project.projectManagerId?.name || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link
                href={`/projects/${project._id}/tasks/new`}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                Add Task
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Budget</dt>
              <dd className="mt-1 text-sm text-gray-900">
                ${project.budget ? project.budget.toLocaleString() : '0'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Progress</dt>
              <dd className="mt-1 text-sm text-gray-900">{project.progress || 0}%</dd>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tasks</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {/* To Do */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">To Do</h3>
              <div className="space-y-3">
                {getTasksByStatus('todo').map((task) => (
                  <div key={task._id} className="bg-white p-3 rounded shadow-sm border">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to: {task.assignedTo.name}
                    </p>
                  </div>
                ))}
                {getTasksByStatus('todo').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks</p>
                )}
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">In Progress</h3>
              <div className="space-y-3">
                {getTasksByStatus('in_progress').map((task) => (
                  <div key={task._id} className="bg-white p-3 rounded shadow-sm border">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to: {task.assignedTo.name}
                    </p>
                  </div>
                ))}
                {getTasksByStatus('in_progress').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks</p>
                )}
              </div>
            </div>

            {/* Review */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Review</h3>
              <div className="space-y-3">
                {getTasksByStatus('review').map((task) => (
                  <div key={task._id} className="bg-white p-3 rounded shadow-sm border">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to: {task.assignedTo.name}
                    </p>
                  </div>
                ))}
                {getTasksByStatus('review').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks</p>
                )}
              </div>
            </div>

            {/* Completed */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Completed</h3>
              <div className="space-y-3">
                {getTasksByStatus('completed').map((task) => (
                  <div key={task._id} className="bg-white p-3 rounded shadow-sm border">
                    <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Assigned to: {task.assignedTo.name}
                    </p>
                  </div>
                ))}
                {getTasksByStatus('completed').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Chart */}
        {project.startDate && project.endDate && (
          <div className="mt-8">
            <GanttChart
              tasks={tasks}
              projectStartDate={project.startDate}
              projectEndDate={project.endDate}
            />
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-8">
          <CommentsSection projectId={params.id as string} />
        </div>

        {/* File Upload Section */}
        <div className="mt-8">
          <FileUpload projectId={params.id as string} />
        </div>
      </div>
    </div>
  );
}