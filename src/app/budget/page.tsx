'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Project {
  _id: string;
  name: string;
  budget: number;
}

interface Budget {
  _id: string;
  projectId: {
    _id: string;
    name: string;
  };
  category: string;
  plannedAmount: number;
  actualAmount: number;
  description?: string;
}

export default function BudgetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [formData, setFormData] = useState({
    projectId: '',
    category: '',
    plannedAmount: '',
    actualAmount: '',
    description: '',
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
      const [projectsRes, budgetsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/budgets'),
      ]);

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        const projectsArray = Array.isArray(projectsData.projects) ? projectsData.projects : [];
        setProjects(projectsArray);
      }
      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        const budgetsArray = Array.isArray(budgetsData) ? budgetsData : [];
        setBudgets(budgetsArray);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setProjects([]);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          plannedAmount: parseFloat(formData.plannedAmount),
          actualAmount: parseFloat(formData.actualAmount) || 0,
        }),
      });

      if (response.ok) {
        const newBudget = await response.json();
        setBudgets([...budgets, newBudget]);
        setFormData({
          projectId: '',
          category: '',
          plannedAmount: '',
          actualAmount: '',
          description: '',
        });
        setShowForm(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Error creating budget item');
      }
    } catch (error) {
      console.error('Error creating budget item:', error);
      alert('Error creating budget item');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      equipment: 'bg-blue-100 text-blue-800',
      personnel: 'bg-green-100 text-green-800',
      location: 'bg-yellow-100 text-yellow-800',
      'post-production': 'bg-purple-100 text-purple-800',
      marketing: 'bg-indigo-100 text-indigo-800',
      travel: 'bg-pink-100 text-pink-800',
      miscellaneous: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getProjectBudgetSummary = (projectId: string) => {
    const projectBudgets = budgets.filter(b => b.projectId._id === projectId);
    const totalPlanned = projectBudgets.reduce((sum, b) => sum + b.plannedAmount, 0);
    const totalActual = projectBudgets.reduce((sum, b) => sum + b.actualAmount, 0);
    return { totalPlanned, totalActual };
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
                Budget Management
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Track project budgets and expenses
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                {showForm ? 'Cancel' : 'Add Budget Item'}
              </button>
            </div>
          </div>
        </div>

        {/* Add Budget Item Form */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Budget Item</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    name="category"
                    id="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select category</option>
                    <option value="equipment">Equipment</option>
                    <option value="personnel">Personnel</option>
                    <option value="location">Location</option>
                    <option value="post-production">Post-Production</option>
                    <option value="marketing">Marketing</option>
                    <option value="travel">Travel</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="plannedAmount" className="block text-sm font-medium text-gray-700">
                    Planned Amount *
                  </label>
                  <input
                    type="number"
                    name="plannedAmount"
                    id="plannedAmount"
                    required
                    value={formData.plannedAmount}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="actualAmount" className="block text-sm font-medium text-gray-700">
                    Actual Amount
                  </label>
                  <input
                    type="number"
                    name="actualAmount"
                    id="actualAmount"
                    value={formData.actualAmount}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Description of the budget item..."
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
                  Add Budget Item
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Project Budget Summary */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {projects.map((project) => {
            const { totalPlanned, totalActual } = getProjectBudgetSummary(project._id);
            const variance = totalActual - totalPlanned;
            const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;

            return (
              <div key={project._id} className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">{project.name}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Project Budget:</span>
                    <span className="text-sm font-medium">${project.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Planned:</span>
                    <span className="text-sm font-medium">${totalPlanned.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Actual:</span>
                    <span className="text-sm font-medium">${totalActual.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Variance:</span>
                    <span className={`text-sm font-medium ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${variance.toLocaleString()} ({variancePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Budget Items List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Budget Items
            </h3>
          </div>

          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No budget items</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding budget items to your projects.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {budgets.map((budget) => (
                <li key={budget._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {budget.projectId.name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(budget.category)}`}>
                            {budget.category}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>Planned: ${budget.plannedAmount.toLocaleString()}</span>
                          <span className="mx-2">•</span>
                          <span>Actual: ${budget.actualAmount.toLocaleString()}</span>
                          <span className="mx-2">•</span>
                          <span className={budget.actualAmount > budget.plannedAmount ? 'text-red-600' : 'text-green-600'}>
                            Variance: ${(budget.actualAmount - budget.plannedAmount).toLocaleString()}
                          </span>
                        </div>
                        {budget.description && (
                          <p className="mt-2 text-sm text-gray-600">{budget.description}</p>
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