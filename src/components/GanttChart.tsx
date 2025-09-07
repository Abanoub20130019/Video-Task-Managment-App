'use client';

import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!canvasRef.current || tasks.length === 0) return;

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
      // Use project start date as task start if no specific start date, or 3 days before due date
      const taskStart = task.startDate
        ? new Date(task.startDate)
        : new Date(taskEnd.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days before due date

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
      ctx.fillText(task.assignedTo.name, barX + 5, y + 3);
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

  if (tasks.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline (Gantt Chart)</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">No tasks to display in timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Timeline (Gantt Chart)</h3>
      <div className="overflow-x-auto">
        <canvas
          ref={canvasRef}
          className="border border-gray-200 rounded"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span>To Do</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
          <span>Review</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}