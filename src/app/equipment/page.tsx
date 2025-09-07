'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Equipment {
  _id: string;
  name: string;
  type: string;
  availability: boolean;
  location: string;
  maintenanceSchedule?: Date;
}

export default function EquipmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    availability: true,
    location: '',
    maintenanceSchedule: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchEquipment();
    }
  }, [session]);

  const fetchEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maintenanceSchedule: formData.maintenanceSchedule || undefined,
        }),
      });

      if (response.ok) {
        const newEquipment = await response.json();
        setEquipment([...equipment, newEquipment]);
        setFormData({
          name: '',
          type: '',
          availability: true,
          location: '',
          maintenanceSchedule: '',
        });
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating equipment');
      }
    } catch (error) {
      console.error('Error creating equipment:', error);
      alert('Error creating equipment');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const getEquipmentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Camera: 'bg-blue-100 text-blue-800',
      Microphone: 'bg-green-100 text-green-800',
      Lighting: 'bg-yellow-100 text-yellow-800',
      Stabilizer: 'bg-purple-100 text-purple-800',
      Computer: 'bg-indigo-100 text-indigo-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
                Equipment Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track your video production equipment
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                {showForm ? 'Cancel' : 'Add Equipment'}
              </button>
            </div>
          </div>
        </div>

        {/* Add Equipment Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Equipment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Type *
                  </label>
                  <select
                    name="type"
                    id="type"
                    required
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select type</option>
                    <option value="Camera">Camera</option>
                    <option value="Microphone">Microphone</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Stabilizer">Stabilizer</option>
                    <option value="Computer">Computer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="maintenanceSchedule" className="block text-sm font-medium text-gray-700">
                    Maintenance Schedule
                  </label>
                  <input
                    type="date"
                    name="maintenanceSchedule"
                    id="maintenanceSchedule"
                    value={formData.maintenanceSchedule}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  id="availability"
                  name="availability"
                  type="checkbox"
                  checked={formData.availability}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="availability" className="ml-2 block text-sm text-gray-900">
                  Available for use
                </label>
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
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Equipment List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {equipment.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first equipment item.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {equipment.map((item) => (
                <li key={item._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEquipmentTypeColor(item.type)}`}>
                              {item.type}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.availability ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          {item.location && <p>Location: {item.location}</p>}
                          {item.maintenanceSchedule && (
                            <>
                              {item.location && <span className="mx-2">•</span>}
                              <p>Maintenance: {new Date(item.maintenanceSchedule).toLocaleDateString()}</p>
                            </>
                          )}
                        </div>
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