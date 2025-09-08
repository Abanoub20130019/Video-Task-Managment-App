'use client';

import { useEffect, useRef, useState } from 'react';

interface Task {
  _id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  assignedTo: {
    name: string;
  };
  startDate?: string;
  endDate?: string;
}

interface GanttChartProps {
  tasks: Task[];
  projectStartDate: string;
  projectEndDate: string;
}

export default function GanttChart({ tasks, projectStartDate, projectEndDate }: GanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || tasks.length === 0 || !projectStartDate || !projectEndDate) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = Math.max(400, tasks.length * 40 + 100);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate date range
    const startDate = new Date(projectStartDate);
    const endDate = new Date(projectEndDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Draw header
    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, canvas.width, 60);

    // Draw task rows
    tasks.forEach((task, index) => {
      const y = 80 + index * 40;

      // Draw task bar background
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(0, y - 15, canvas.width, 30);

      // Calculate task position and width
      const taskEnd = new Date(task.dueDate);
      // Use actual startDate if available, otherwise use project start date, or fallback to 3 days before due date
      const taskStart = task.startDate
        ? new Date(task.startDate)
        : new Date(Math.max(
            new Date(projectStartDate).getTime(),
            taskEnd.getTime() - (3 * 24 * 60 * 60 * 1000)
          )); // Use project start date or 3 days before due date, whichever is later

      const taskStartOffset = Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const taskDuration = Math.max(Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)), 1);

      const barX = (taskStartOffset / totalDays) * (canvas.width - 200) + 200;
      const barWidth = Math.max((taskDuration / totalDays) * (canvas.width - 200), 20);

      // Draw task bar
      let barColor = '#3B82F6'; // Default blue
      switch (task.status) {
        case 'completed':
          barColor = '#10B981'; // Green
          break;
        case 'in_progress':
          barColor = '#F59E0B'; // Yellow
          break;
        case 'review':
          barColor = '#8B5CF6'; // Purple
          break;
      }

      ctx.fillStyle = barColor;
      ctx.fillRect(barX, y - 10, barWidth, 20);

      // Draw task text
      ctx.fillStyle = '#111827';
      ctx.font = '12px Arial';
      ctx.fillText(task.title.substring(0, 20), 10, y + 5);

      // Draw assignee
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px Arial';
      ctx.fillText(task.assignedTo?.name || 'Unassigned', barX + 5, y + 3);
    });

    // Draw timeline
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;

    for (let i = 0; i <= totalDays; i += 7) {
      const x = (i / totalDays) * (canvas.width - 200) + 200;
      ctx.beginPath();
      ctx.moveTo(x, 60);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();

      // Draw date labels
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px Arial';
      ctx.fillText(date.toLocaleDateString(), x + 5, 75);
    }

  }, [tasks, projectStartDate, projectEndDate]);

  // Accessible table fallback component
  const GanttTable = () => (
    <div className="overflow-x-auto" role="region" aria-label="Task timeline table">
      <table className="min-w-full divide-y divide-gray-200" role="table">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assigned To
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priority
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duration
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.map((task, index) => {
            const taskEnd = new Date(task.dueDate);
            const taskStart = task.startDate
              ? new Date(task.startDate)
              : new Date(Math.max(
                  new Date(projectStartDate).getTime(),
                  taskEnd.getTime() - (3 * 24 * 60 * 60 * 1000)
                ));
            const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
            
            const statusColors = {
              'todo': 'bg-blue-100 text-blue-800',
              'in_progress': 'bg-yellow-100 text-yellow-800',
              'review': 'bg-purple-100 text-purple-800',
              'completed': 'bg-green-100 text-green-800'
            };

            const priorityColors = {
              'low': 'bg-gray-100 text-gray-800',
              'medium': 'bg-orange-100 text-orange-800',
              'high': 'bg-red-100 text-red-800'
            };

            return (
              <tr key={task._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {task.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.assignedTo?.name || 'Unassigned'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[task.status as keyof typeof statusColors]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {taskStart.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {taskEnd.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {duration} day{duration !== 1 ? 's' : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow" role="region" aria-label="Project timeline">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline (Gantt Chart)</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks to display in timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow" role="region" aria-label="Project timeline">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Project Timeline (Gantt Chart)</h3>
        <button
          onClick={() => setShowTable(!showTable)}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          aria-label={showTable ? 'Switch to chart view' : 'Switch to accessible table view'}
        >
          {showTable ? 'Chart View' : 'Table View'}
        </button>
      </div>

      {showTable ? (
        <GanttTable />
      ) : (
        <>
          <div className="overflow-x-auto">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 rounded"
              style={{ maxWidth: '100%', height: 'auto' }}
              role="img"
              aria-label={`Gantt chart showing ${tasks.length} tasks from ${new Date(projectStartDate).toLocaleDateString()} to ${new Date(projectEndDate).toLocaleDateString()}`}
            />
          </div>
          
          {/* Screen reader accessible description */}
          <div className="sr-only">
            <h4>Task Timeline Details:</h4>
            <ul>
              {tasks.map((task) => {
                const taskEnd = new Date(task.dueDate);
                const taskStart = task.startDate
                  ? new Date(task.startDate)
                  : new Date(Math.max(
                      new Date(projectStartDate).getTime(),
                      taskEnd.getTime() - (3 * 24 * 60 * 60 * 1000)
                    ));
                return (
                  <li key={task._id}>
                    {task.title}: {task.status} priority {task.priority},
                    assigned to {task.assignedTo?.name || 'Unassigned'},
                    from {taskStart.toLocaleDateString()} to {taskEnd.toLocaleDateString()}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm" role="group" aria-label="Status legend">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2" aria-hidden="true"></div>
          <span>To Do</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded mr-2" aria-hidden="true"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded mr-2" aria-hidden="true"></div>
          <span>Review</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2" aria-hidden="true"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}