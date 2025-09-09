'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SearchAndFilter from '@/components/SearchAndFilter';

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
  };
  projectManagerId: {
    name: string;
    email: string;
  };
}

export default function Projects() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
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
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      setError(null);
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        // The API returns { projects: [...], pagination: {...} }
        const projectsArray = Array.isArray(data.projects) ? data.projects : [];
        setProjects(projectsArray);
        setFilteredProjects(projectsArray);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch projects:', response.status, errorText);
        setError(`Failed to load projects: ${response.status}`);
        setProjects([]);
        setFilteredProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Network error: Unable to load projects');
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFiltersAndSearch(query, filters);
  };

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
    applyFiltersAndSearch(searchQuery, newFilters);
  };

  const applyFiltersAndSearch = (query: string, filterOptions: any) => {
    let filtered = [...projects];

    // Apply search
    if (query) {
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.description.toLowerCase().includes(query.toLowerCase()) ||
        project.clientId.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply filters
    if (filterOptions.status) {
      filtered = filtered.filter(project => project.status === filterOptions.status);
    }

    if (filterOptions.dateRange) {
      const { start, end } = filterOptions.dateRange;
      if (start) {
        filtered = filtered.filter(project => new Date(project.startDate) >= new Date(start));
      }
      if (end) {
        filtered = filtered.filter(project => new Date(project.endDate) <= new Date(end));
      }
    }

    setFilteredProjects(filtered);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 md:py-8">
          <div className="space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold leading-7 text-gray-900">
                Projects
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your video shooting projects
              </p>
            </div>
            <div className="flex-shrink-0">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 w-full md:w-auto"
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
                  fetchProjects();
                }}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <SearchAndFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          placeholder="Search projects..."
          showFilters={true}
        />

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 px-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
              <div className="mt-6">
                <Link
                  href="/projects/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 w-full justify-center md:w-auto"
                >
                  Create Project
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <li key={project._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}>
                      <div className="flex-1 min-w-0">
                        <div className={`${isMobile ? 'space-y-2' : 'flex items-center justify-between'}`}>
                          <p className="text-sm font-medium text-indigo-600 break-words">
                            {project.name}
                          </p>
                          <div className={`${isMobile ? '' : 'ml-2'} flex-shrink-0 flex`}>
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                              {project.status.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <p className="break-words">{project.description}</p>
                        </div>
                        <div className={`mt-2 text-xs md:text-sm text-gray-500 ${isMobile ? 'space-y-1' : 'flex items-center'}`}>
                          <p className="break-all">Client: {project.clientId.name}</p>
                          {!isMobile && <span className="mx-2">•</span>}
                          <p className="break-all">Manager: {project.projectManagerId.name}</p>
                          {!isMobile && <span className="mx-2">•</span>}
                          <p>Budget: ${project.budget.toLocaleString()}</p>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center justify-between text-xs md:text-sm text-gray-600">
                                <span>Progress</span>
                                <span>{project.progress}%</span>
                              </div>
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${project.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className={`${isMobile ? '' : 'ml-4'} flex-shrink-0`}>
                        <Link
                          href={`/projects/${project._id}`}
                          className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${isMobile ? 'w-full' : ''}`}
                          style={{ touchAction: 'manipulation' }} // Prevent double-tap zoom
                        >
                          View Project
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}