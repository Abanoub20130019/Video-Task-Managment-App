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
  const containerRef = useRef<HTMLDivElement>(null);
  const [showTable, setShowTable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canvasError, setCanvasError] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(mobile);
      // Default to table view on mobile for better performance
      if (mobile && !showTable) {
        setShowTable(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [showTable]);

  useEffect(() => {
    if (!canvasRef.current || tasks.length === 0 || !projectStartDate || !projectEndDate || showTable) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCanvasError(true);
        return;
      }

      // Get container width for responsive canvas
      const containerWidth = containerRef.current?.clientWidth || 800;
      const maxWidth = Math.min(containerWidth - 40, isMobile ? 600 : 1200);
      const canvasWidth = Math.max(400, maxWidth);
      const canvasHeight = Math.max(300, Math.min(tasks.length * 40 + 100, isMobile ? 400 : 600));

      // Set canvas size with device pixel ratio for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      ctx.scale(dpr, dpr);

      // Set canvas size for calculations
      const displayWidth = canvasWidth;
      const displayHeight = canvasHeight;

      // Clear canvas
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Calculate date range
      const startDate = new Date(projectStartDate);
      const endDate = new Date(projectEndDate);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (totalDays <= 0) {
        setCanvasError(true);
        return;
      }

      // Draw header
      ctx.fillStyle = '#374151';
      ctx.fillRect(0, 0, displayWidth, 60);

      // Draw task rows with mobile optimization
      const maxTasks = isMobile ? Math.min(tasks.length, 10) : tasks.length;
      const taskHeight = isMobile ? 35 : 40;
      
      tasks.slice(0, maxTasks).forEach((task, index) => {
        const y = 80 + index * taskHeight;

        // Draw task bar background
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(0, y - 15, displayWidth, 30);

        // Calculate task position and width
        const taskEnd = new Date(task.dueDate);
        const taskStart = task.startDate
          ? new Date(task.startDate)
          : new Date(Math.max(
              new Date(projectStartDate).getTime(),
              taskEnd.getTime() - (3 * 24 * 60 * 60 * 1000)
            ));

        const taskStartOffset = Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const taskDuration = Math.max(Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 1000)), 1);

        const labelWidth = isMobile ? 150 : 200;
        const barX = Math.max(labelWidth, (taskStartOffset / totalDays) * (displayWidth - labelWidth) + labelWidth);
        const barWidth = Math.max((taskDuration / totalDays) * (displayWidth - labelWidth), 10);

        // Draw task bar
        let barColor = '#3B82F6';
        switch (task.status) {
          case 'completed':
            barColor = '#10B981';
            break;
          case 'in_progress':
            barColor = '#F59E0B';
            break;
          case 'review':
            barColor = '#8B5CF6';
            break;
        }

        ctx.fillStyle = barColor;
        ctx.fillRect(barX, y - 10, barWidth, 20);

        // Draw task text with mobile optimization
        ctx.fillStyle = '#111827';
        ctx.font = isMobile ? '10px Arial' : '12px Arial';
        const taskTitle = isMobile ? task.title.substring(0, 15) : task.title.substring(0, 20);
        ctx.fillText(taskTitle, 10, y + 5);

        // Draw assignee (skip on very small screens)
        if (!isMobile || displayWidth > 500) {
          ctx.fillStyle = '#6B7280';
          ctx.font = isMobile ? '8px Arial' : '10px Arial';
          const assigneeName = task.assignedTo?.name || 'Unassigned';
          const maxAssigneeLength = isMobile ? 8 : 12;
          ctx.fillText(assigneeName.substring(0, maxAssigneeLength), barX + 5, y + 3);
        }
      });

      // Draw timeline with mobile optimization
      ctx.strokeStyle = '#D1D5DB';
      ctx.lineWidth = 1;

      const timelineStep = isMobile ? Math.max(7, Math.ceil(totalDays / 5)) : 7;
      for (let i = 0; i <= totalDays; i += timelineStep) {
        const labelWidth = isMobile ? 150 : 200;
        const x = (i / totalDays) * (displayWidth - labelWidth) + labelWidth;
        ctx.beginPath();
        ctx.moveTo(x, 60);
        ctx.lineTo(x, displayHeight);
        ctx.stroke();

        // Draw date labels
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        ctx.fillStyle = '#6B7280';
        ctx.font = isMobile ? '8px Arial' : '10px Arial';
        const dateStr = isMobile ?
          `${date.getMonth() + 1}/${date.getDate()}` :
          date.toLocaleDateString();
        ctx.fillText(dateStr, x + 2, 75);
      }

      // Show truncation message for mobile
      if (isMobile && tasks.length > maxTasks) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Arial';
        ctx.fillText(`... and ${tasks.length - maxTasks} more tasks`, 10, displayHeight - 20);
      }

    } catch (error) {
      console.error('Canvas rendering error:', error);
      setCanvasError(true);
    }
  }, [tasks, projectStartDate, projectEndDate, showTable, isMobile]);

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

      {showTable || canvasError ? (
        <div>
          {canvasError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                Chart view is not available. Showing table view instead.
              </p>
            </div>
          )}
          <GanttTable />
        </div>
      ) : (
        <>
          <div ref={containerRef} className="overflow-x-auto">
            <canvas
              ref={canvasRef}
              className="border border-gray-200 rounded max-w-full"
              style={{
                maxWidth: '100%',
                height: 'auto',
                touchAction: 'pan-x pan-y' // Enable touch scrolling
              }}
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