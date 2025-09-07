'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { showSuccess, showError } from '@/lib/toast';

interface Task {
  _id: string;
  title: string;
  dueDate: string;
  startDate?: string;
  status: string;
  priority: string;
  assignedTo: {
    name: string;
  };
  estimatedHours: number;
}

interface InteractiveGanttChartProps {
  tasks: Task[];
  projectStartDate: string;
  projectEndDate: string;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  editable?: boolean;
}

export default function InteractiveGanttChart({ 
  tasks, 
  projectStartDate, 
  projectEndDate, 
  onTaskUpdate,
  editable = false 
}: InteractiveGanttChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) return;

    drawGanttChart();
  }, [tasks, projectStartDate, projectEndDate, selectedTask]);

  const drawGanttChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous chart

    const margin = { top: 60, right: 50, bottom: 60, left: 200 };
    const width = 1000 - margin.left - margin.right;
    const height = Math.max(400, tasks.length * 50 + 100) - margin.top - margin.bottom;

    // Set up scales
    const startDate = new Date(projectStartDate);
    const endDate = new Date(projectEndDate);
    
    const xScale = d3.scaleTime()
      .domain([startDate, endDate])
      .range([0, width]);

    const yScale = d3.scaleBand()
      .domain(tasks.map(t => t._id))
      .range([0, height])
      .padding(0.1);

    // Create main group
    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add background grid
    const weekInterval = d3.timeWeek.every(1);
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.timeFormat('%m/%d') as any)
      .ticks(weekInterval || d3.timeWeek);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', 'var(--text-secondary)');

    // Add vertical grid lines
    if (weekInterval) {
      g.selectAll('.grid-line')
        .data(xScale.ticks(weekInterval))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', (d: any) => xScale(d))
        .attr('x2', (d: any) => xScale(d))
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', 'var(--border-primary)')
        .style('stroke-width', 1)
        .style('opacity', 0.3);
    }

    // Color mapping for task status
    const statusColors = {
      'todo': '#3B82F6',
      'in_progress': '#F59E0B',
      'review': '#8B5CF6',
      'completed': '#10B981'
    };

    const priorityOpacity = {
      'low': 0.6,
      'medium': 0.8,
      'high': 1.0
    };

    // Draw task bars
    const taskBars = g.selectAll('.task-bar')
      .data(tasks)
      .enter()
      .append('g')
      .attr('class', 'task-bar')
      .attr('transform', d => `translate(0,${yScale(d._id)})`);

    // Task background
    taskBars.append('rect')
      .attr('class', 'task-bg')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', yScale.bandwidth())
      .style('fill', (d, i) => i % 2 === 0 ? 'var(--bg-secondary)' : 'var(--bg-tertiary)')
      .style('opacity', 0.3);

    // Calculate task positions
    const taskRects = taskBars.append('rect')
      .attr('class', 'task-rect')
      .attr('x', d => {
        const taskStart = d.startDate 
          ? new Date(d.startDate)
          : new Date(Math.max(
              startDate.getTime(),
              new Date(d.dueDate).getTime() - (3 * 24 * 60 * 60 * 1000)
            ));
        return xScale(taskStart);
      })
      .attr('y', 5)
      .attr('width', d => {
        const taskStart = d.startDate 
          ? new Date(d.startDate)
          : new Date(Math.max(
              startDate.getTime(),
              new Date(d.dueDate).getTime() - (3 * 24 * 60 * 60 * 1000)
            ));
        const taskEnd = new Date(d.dueDate);
        return Math.max(xScale(taskEnd) - xScale(taskStart), 20);
      })
      .attr('height', yScale.bandwidth() - 10)
      .style('fill', d => statusColors[d.status as keyof typeof statusColors] || '#6B7280')
      .style('opacity', d => priorityOpacity[d.priority as keyof typeof priorityOpacity] || 0.8)
      .style('stroke', d => selectedTask === d._id ? '#1F2937' : 'none')
      .style('stroke-width', 2)
      .style('cursor', editable ? 'pointer' : 'default')
      .style('rx', 4)
      .style('ry', 4);

    // Add task labels
    taskBars.append('text')
      .attr('class', 'task-label')
      .attr('x', -10)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('text-anchor', 'end')
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('fill', 'var(--text-primary)')
      .text(d => d.title.length > 20 ? d.title.substring(0, 20) + '...' : d.title);

    // Add assignee labels on bars
    taskBars.append('text')
      .attr('class', 'assignee-label')
      .attr('x', d => {
        const taskStart = d.startDate 
          ? new Date(d.startDate)
          : new Date(Math.max(
              startDate.getTime(),
              new Date(d.dueDate).getTime() - (3 * 24 * 60 * 60 * 1000)
            ));
        return xScale(taskStart) + 5;
      })
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('fill', 'white')
      .style('font-weight', '500')
      .text(d => d.assignedTo.name);

    // Add interactivity if editable
    if (editable) {
      taskRects
        .on('click', function(event, d) {
          event.stopPropagation();
          setSelectedTask(selectedTask === d._id ? null : d._id);
        })
        .on('mouseover', function(event, d) {
          if (!isDragging) {
            d3.select(this)
              .style('opacity', 0.9)
              .style('stroke', '#1F2937')
              .style('stroke-width', 1);
            
            showTooltip(event, d);
          }
        })
        .on('mouseout', function(event, d) {
          if (!isDragging && selectedTask !== d._id) {
            d3.select(this)
              .style('stroke', 'none');
          }
          hideTooltip();
        });

      // Add drag behavior for task rescheduling
      const drag = d3.drag()
        .on('start', function(event, d) {
          setIsDragging(true);
          d3.select(this).style('opacity', 0.7);
        })
        .on('drag', function(event, d) {
          const newX = Math.max(0, Math.min(width - 20, event.x));
          d3.select(this).attr('x', newX);
        })
        .on('end', function(event, d) {
          setIsDragging(false);
          d3.select(this).style('opacity', 1);
          
          const newX = Math.max(0, Math.min(width - 20, event.x));
          const newStartDate = xScale.invert(newX);
          
          // Calculate new due date maintaining duration
          const originalStart = d.startDate ? new Date(d.startDate) : new Date(d.dueDate);
          const originalEnd = new Date(d.dueDate);
          const duration = originalEnd.getTime() - originalStart.getTime();
          const newDueDate = new Date(newStartDate.getTime() + duration);
          
          if (onTaskUpdate) {
            onTaskUpdate(d._id, {
              startDate: newStartDate.toISOString(),
              dueDate: newDueDate.toISOString(),
            });
            showSuccess(`Task "${d.title}" rescheduled`);
          }
        });

      taskRects.call(drag as any);
    }

    // Add today line
    const today = new Date();
    if (today >= startDate && today <= endDate) {
      g.append('line')
        .attr('class', 'today-line')
        .attr('x1', xScale(today))
        .attr('x2', xScale(today))
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', '#EF4444')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');

      g.append('text')
        .attr('x', xScale(today))
        .attr('y', -10)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .style('fill', '#EF4444')
        .text('Today');
    }

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left}, 20)`);

    const legendData = [
      { status: 'todo', color: statusColors.todo, label: 'To Do' },
      { status: 'in_progress', color: statusColors.in_progress, label: 'In Progress' },
      { status: 'review', color: statusColors.review, label: 'Review' },
      { status: 'completed', color: statusColors.completed, label: 'Completed' },
    ];

    const legendItems = legend.selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(${i * 120}, 0)`);

    legendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .style('fill', d => d.color)
      .style('rx', 2);

    legendItems.append('text')
      .attr('x', 18)
      .attr('y', 6)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', 'var(--text-secondary)')
      .text(d => d.label);
  };

  const showTooltip = (event: any, task: Task) => {
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'gantt-tooltip')
      .style('position', 'absolute')
      .style('background', 'var(--bg-primary)')
      .style('border', '1px solid var(--border-primary)')
      .style('border-radius', '8px')
      .style('padding', '12px')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)')
      .style('z-index', '1000')
      .style('opacity', 0);

    const taskStart = task.startDate 
      ? new Date(task.startDate)
      : new Date(Math.max(
          new Date(projectStartDate).getTime(),
          new Date(task.dueDate).getTime() - (3 * 24 * 60 * 60 * 1000)
        ));
    const taskEnd = new Date(task.dueDate);
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));

    tooltip.html(`
      <div style="color: var(--text-primary);">
        <div style="font-weight: 600; margin-bottom: 8px;">${task.title}</div>
        <div style="margin-bottom: 4px;"><strong>Assigned:</strong> ${task.assignedTo.name}</div>
        <div style="margin-bottom: 4px;"><strong>Status:</strong> ${task.status.replace('_', ' ')}</div>
        <div style="margin-bottom: 4px;"><strong>Priority:</strong> ${task.priority}</div>
        <div style="margin-bottom: 4px;"><strong>Duration:</strong> ${duration} day${duration !== 1 ? 's' : ''}</div>
        <div style="margin-bottom: 4px;"><strong>Start:</strong> ${taskStart.toLocaleDateString()}</div>
        <div style="margin-bottom: 4px;"><strong>Due:</strong> ${taskEnd.toLocaleDateString()}</div>
        <div><strong>Estimated:</strong> ${task.estimatedHours}h</div>
        ${editable ? '<div style="margin-top: 8px; font-size: 10px; color: var(--text-tertiary);">Click to select • Drag to reschedule</div>' : ''}
      </div>
    `)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .transition()
    .duration(200)
    .style('opacity', 1);
  };

  const hideTooltip = () => {
    d3.selectAll('.gantt-tooltip')
      .transition()
      .duration(200)
      .style('opacity', 0)
      .remove();
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    if (!onTaskUpdate) return;

    try {
      await onTaskUpdate(taskId, { status: newStatus });
      showSuccess('Task status updated');
    } catch (error) {
      showError('Failed to update task status');
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow" role="region" aria-label="Project timeline">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">
          Interactive Project Timeline
        </h3>
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-gray-500 dark:text-slate-400 mt-2">No tasks to display in timeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow" role="region" aria-label="Interactive project timeline">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">
          Interactive Project Timeline
        </h3>
        {editable && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Drag to reschedule</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          className="border border-gray-200 dark:border-slate-700 rounded-lg"
          style={{ minWidth: '800px', height: 'auto' }}
          role="img"
          aria-label={`Interactive Gantt chart showing ${tasks.length} tasks from ${new Date(projectStartDate).toLocaleDateString()} to ${new Date(projectEndDate).toLocaleDateString()}`}
        />
      </div>

      {/* Task details panel for selected task */}
      {selectedTask && editable && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          {(() => {
            const task = tasks.find(t => t._id === selectedTask);
            if (!task) return null;

            return (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-slate-100 mb-3">
                  {task.title}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      value={task.status}
                      onChange={(e) => handleTaskStatusChange(task._id, e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={task.priority}
                      onChange={(e) => onTaskUpdate?.(task._id, { priority: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                      Assignee
                    </label>
                    <span className="block px-2 py-1 text-sm text-gray-700 dark:text-slate-300">
                      {task.assignedTo.name}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                      Estimated Hours
                    </label>
                    <span className="block px-2 py-1 text-sm text-gray-700 dark:text-slate-300">
                      {task.estimatedHours}h
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Instructions */}
      {editable && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Interactive Features:</strong> Click tasks to select and edit details. Drag task bars to reschedule. 
            Hover for detailed information.
          </p>
        </div>
      )}
    </div>
  );
}

// Hook for Gantt chart data management
export function useGanttData(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}&limit=1000`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      showError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...updates } : t));
        return updatedTask;
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  return {
    tasks,
    loading,
    updateTask,
    refetch: fetchTasks,
  };
}