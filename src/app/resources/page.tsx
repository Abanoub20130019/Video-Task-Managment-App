'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Project {
  _id: string;
  name: string;
}

interface Equipment {
  _id: string;
  name: string;
  type: string;
  availability: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Allocation {
  _id: string;
  projectId: {
    name: string;
  };
  equipmentId?: {
    name: string;
    type: string;
  };
  userId?: {
    name: string;
    email: string;
  };
  allocatedFrom: string;
  allocatedTo: string;
  status: string;
  notes?: string;
}

export default function ResourcesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    equipmentId: '',
    userId: '',
    allocatedFrom: '',
    allocatedTo: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [projectsRes, equipmentRes, usersRes, allocationsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/equipment'),
        fetch('/api/users'),
        fetch('/api/allocations'),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        const projectsArray = Array.isArray(projectsData.projects) ? projectsData.projects : [];
        setProjects(projectsArray);
      }
      if (equipmentRes.ok) {
        const equipmentData = await equipmentRes.json();
        const equipmentArray = Array.isArray(equipmentData) ? equipmentData : [];
        setEquipment(equipmentArray);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const usersArray = Array.isArray(usersData.users) ? usersData.users : [];
        setUsers(usersArray);
      }
      if (allocationsRes.ok) {
        const allocationsData = await allocationsRes.json();
        const allocationsArray = Array.isArray(allocationsData) ? allocationsData : [];
        setAllocations(allocationsArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProjects([]);
      setEquipment([]);
      setUsers([]);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newAllocation = await response.json();
        setAllocations([...allocations, newAllocation]);
        setFormData({
          projectId: '',
          equipmentId: '',
          userId: '',
          allocatedFrom: '',
          allocatedTo: '',
          notes: '',
        });
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating allocation');
      }
    } catch (error) {
      console.error('Error creating allocation:', error);
      alert('Error creating allocation');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allocated':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-green-100 text-green-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
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
        <div className="py-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Resource Allocation
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Allocate equipment and personnel to projects
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                {showForm ? 'Cancel' : 'Allocate Resource'}
              </button>
            </div>
          </div>
        </div>

        {/* Allocation Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Allocate Resource</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                  Project *
                </label>
                <select
                  name="projectId"
                  id="projectId"
                  required
                  value={formData.projectId}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="equipmentId" className="block text-sm font-medium text-gray-700">
                    Equipment
                  </label>
                  <select
                    name="equipmentId"
                    id="equipmentId"
                    value={formData.equipmentId}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select equipment (optional)</option>
                    {equipment
                      .filter((item) => item.availability)
                      .map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.name} ({item.type})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                    Personnel
                  </label>
                  <select
                    name="userId"
                    id="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select personnel (optional)</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="allocatedFrom" className="block text-sm font-medium text-gray-700">
                    From Date *
                  </label>
                  <input
                    type="date"
                    name="allocatedFrom"
                    id="allocatedFrom"
                    required
                    value={formData.allocatedFrom}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="allocatedTo" className="block text-sm font-medium text-gray-700">
                    To Date *
                  </label>
                  <input
                    type="date"
                    name="allocatedTo"
                    id="allocatedTo"
                    required
                    value={formData.allocatedTo}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Additional notes about the allocation..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Allocate Resource
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Allocations List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Current Allocations
            </h3>
          </div>

          {allocations.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No allocations</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by allocating resources to projects.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {allocations.map((allocation) => (
                <li key={allocation._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {allocation.projectId.name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(allocation.status)}`}>
                            {allocation.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          {allocation.equipmentId && (
                            <span>Equipment: {allocation.equipmentId.name} ({allocation.equipmentId.type})</span>
                          )}
                          {allocation.userId && (
                            <>
                              {allocation.equipmentId && <span className="mx-2">•</span>}
                              <span>Personnel: {allocation.userId.name}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>
                            {new Date(allocation.allocatedFrom).toLocaleDateString()} - {new Date(allocation.allocatedTo).toLocaleDateString()}
                          </span>
                        </div>
                        {allocation.notes && (
                          <p className="mt-2 text-sm text-gray-600">{allocation.notes}</p>
                        )}
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