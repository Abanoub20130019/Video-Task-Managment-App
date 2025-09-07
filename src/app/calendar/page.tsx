'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Schedule {
  _id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location: string;
  projectId: {
    name: string;
  };
  assignedResources: Array<{
    name: string;
    email: string;
  }>;
}

interface Project {
  _id: string;
  name: string;
}

export default function Calendar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    startDate: '',
    endDate: '',
    location: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchSchedules();
      fetchProjects();
    }
  }, [session]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules');
      if (response.ok) {
        const data = await response.json();
        const schedules = Array.isArray(data) ? data : (data.schedules || []);
        setSchedules(schedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const projects = Array.isArray(data) ? data : (data.projects || []);
        setProjects(projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          projectId: '',
          title: '',
          startDate: '',
          endDate: '',
          location: '',
        });
        fetchSchedules();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    }
  };

  const _events = schedules.map(schedule => ({
    id: schedule._id,
    title: `${schedule.title} - ${schedule.projectId.name}`,
    start: schedule.startDate,
    end: schedule.endDate,
    extendedProps: {
      location: schedule.location,
      resources: schedule.assignedResources,
    },
  }));

  const handleScheduleClick = (schedule: Schedule) => {
    alert(`
      ${schedule.title}
      Project: ${schedule.projectId.name}
      Location: ${schedule.location || 'Not specified'}
      Assigned: ${schedule.assignedResources.map(r => r.name).join(', ') || 'None'}
      Start: ${new Date(schedule.startDate).toLocaleString()}
      End: ${new Date(schedule.endDate).toLocaleString()}
    `);
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
        <div className="py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Calendar
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Schedule and manage your shooting sessions
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Add Schedule
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="calendar-container">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">October 2024</h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">Previous</button>
                <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">Next</button>
                <button className="px-3 py-1 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded">Today</button>
              </div>
            </div>

            {/* Simple calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Generate calendar days - simplified for demo */}
              {Array.from({ length: 35 }, (_, i) => {
                const dayNumber = i - 3; // Start from October 1st
                const isCurrentMonth = dayNumber >= 1 && dayNumber <= 31;
                const hasEvents = schedules.some(schedule =>
                  new Date(schedule.startDate).getDate() === dayNumber &&
                  new Date(schedule.startDate).getMonth() === 9 // October
                );

                return (
                  <div
                    key={i}
                    className={`min-h-[80px] p-2 border border-gray-200 ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                    } ${hasEvents ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {isCurrentMonth ? dayNumber : ''}
                    </div>
                    {hasEvents && (
                      <div className="text-xs bg-blue-100 text-blue-800 rounded px-1 py-0.5 mb-1">
                        Event
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Schedules</h3>
          <div className="space-y-4">
            {schedules
              .filter(schedule => new Date(schedule.startDate) > new Date())
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 5)
              .map(schedule => (
                <div
                  key={schedule._id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => handleScheduleClick(schedule)}
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{schedule.title}</h4>
                    <p className="text-sm text-gray-500">{schedule.projectId.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(schedule.startDate).toLocaleString()} - {new Date(schedule.endDate).toLocaleString()}
                    </p>
                    {schedule.location && (
                      <p className="text-xs text-gray-400">📍 {schedule.location}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {schedule.assignedResources.length} assigned
                    </p>
                  </div>
                </div>
              ))}
            {schedules.filter(schedule => new Date(schedule.startDate) > new Date()).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming schedules</p>
            )}
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Schedule</h3>
              <form onSubmit={handleAddSchedule} className="space-y-4">
                <div>
                  <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <select
                    id="projectId"
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    id="endDate"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
                  >
                    Add Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}