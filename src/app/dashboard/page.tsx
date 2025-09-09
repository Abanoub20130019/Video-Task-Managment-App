'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ApiTask {
  status: string;
  dueDate?: string;
}
import Link from 'next/link';
import Notifications from '@/components/Notifications';
import { showError, showSuccess, showLoading, dismissToast } from '@/lib/toast';

interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  upcomingDeadlines: number;
  teamMembers: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeTasks: 0,
    upcomingDeadlines: 0,
    teamMembers: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchDashboardStats();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch projects count - use limit=1 to get just the count efficiently
      const projectsResponse = await fetch('/api/projects?limit=1');
      if (projectsResponse.status === 401) {
        // User is not authenticated, redirect to sign in
        router.push('/auth/signin');
        return;
      }
      if (!projectsResponse.ok) {
        throw new Error(`Failed to fetch projects: ${projectsResponse.status} ${projectsResponse.statusText}`);
      }
      const projectsData = await projectsResponse.json();

      // Fetch tasks count - use limit=1 to get just the count efficiently
      const tasksResponse = await fetch('/api/tasks?limit=1');
      if (tasksResponse.status === 401) {
        router.push('/auth/signin');
        return;
      }
      if (!tasksResponse.ok) {
        throw new Error(`Failed to fetch tasks: ${tasksResponse.status} ${tasksResponse.statusText}`);
      }
      const tasksData = await tasksResponse.json();

      // Fetch users count - use limit=1 to get just the count efficiently
      const usersResponse = await fetch('/api/users?limit=1');
      if (usersResponse.status === 401) {
        router.push('/auth/signin');
        return;
      }
      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`);
      }
      const usersData = await usersResponse.json();

      // For calculating active tasks and upcoming deadlines, we need to fetch more tasks
      // We'll fetch all tasks and filter client-side for now (can be optimized later)
      const activeTasksResponse = await fetch('/api/tasks?limit=1000');
      if (activeTasksResponse.status === 401) {
        router.push('/auth/signin');
        return;
      }
      if (!activeTasksResponse.ok) {
        throw new Error(`Failed to fetch active tasks: ${activeTasksResponse.status} ${activeTasksResponse.statusText}`);
      }
      const activeTasksData = await activeTasksResponse.json();
      const allTasks = Array.isArray(activeTasksData.tasks) ? activeTasksData.tasks : [];
      
      // Filter active tasks (not completed)
      const activeTasks = allTasks.filter((task: ApiTask) => task.status !== 'completed').length;

      // Calculate upcoming deadlines (tasks due within 7 days)
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const upcomingDeadlines = allTasks.filter((task: ApiTask) => {
        if (!task.dueDate || task.status === 'completed') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= now && dueDate <= sevenDaysFromNow;
      }).length;

      const dashboardStats = {
        totalProjects: projectsData.pagination?.totalItems || 0,
        activeTasks,
        upcomingDeadlines,
        teamMembers: usersData.pagination?.totalItems || 0,
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
      showError(errorMessage);
      
      // Set default values on error
      setStats({
        totalProjects: 0,
        activeTasks: 0,
        upcomingDeadlines: 0,
        teamMembers: 0,
      });
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="py-4 md:py-8">
          <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold leading-7 text-gray-900 break-words">
                Welcome back, {session.user?.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Here's what's happening with your projects today.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full md:w-auto min-h-[44px]"
                style={{ touchAction: 'manipulation' }}
              >
                Create Project
              </Link>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchDashboardStats();
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium min-h-[44px] px-2"
                style={{ touchAction: 'manipulation' }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <div className={`grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
          {/* Stats Cards */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="ml-3 md:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                      {isMobile ? 'Projects' : 'Total Projects'}
                    </dt>
                    <dd className="text-base md:text-lg font-medium text-gray-900">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                      ) : (
                        stats.totalProjects
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="ml-3 md:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                      {isMobile ? 'Tasks' : 'Active Tasks'}
                    </dt>
                    <dd className="text-base md:text-lg font-medium text-gray-900">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                      ) : (
                        stats.activeTasks
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 md:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                      {isMobile ? 'Deadlines' : 'Upcoming Deadlines'}
                    </dt>
                    <dd className="text-base md:text-lg font-medium text-gray-900">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                      ) : (
                        stats.upcomingDeadlines
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-4 md:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 md:h-6 md:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-3 md:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
                      {isMobile ? 'Team' : 'Team Members'}
                    </dt>
                    <dd className="text-base md:text-lg font-medium text-gray-900">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                      ) : (
                        stats.teamMembers
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-6 md:mt-8 grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Recent Projects */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Projects
              </h3>
              <div className="mt-5">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upcoming Tasks
              </h3>
              <div className="mt-5">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                  <p className="mt-1 text-sm text-gray-500">Tasks will appear here once you create projects.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <Notifications />
          </div>
        </div>
      </div>
    </div>
  );
}