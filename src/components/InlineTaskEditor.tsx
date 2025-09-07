'use client';

import { useState, useRef, useEffect } from 'react';
import { showSuccess, showError } from '@/lib/toast';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  startDate?: string;
  estimatedHours: number;
  actualHours: number;
  assignedTo: {
    _id: string;
    name: string;
  };
}

interface InlineTaskEditorProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onCancel?: () => void;
  field: keyof Task;
  className?: string;
}

export default function InlineTaskEditor({ 
  task, 
  onUpdate, 
  onCancel, 
  field, 
  className = '' 
}: InlineTaskEditorProps) {
  const [value, setValue] = useState(getFieldValue(task, field));
  const [isLoading, setIsLoading] = useState(false);
  const [originalValue] = useState(getFieldValue(task, field));
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select();
      }
    }
  }, []);

  function getFieldValue(task: Task, field: keyof Task): string {
    const val = task[field];
    if (field === 'dueDate' || field === 'startDate') {
      return val ? new Date(val as string).toISOString().split('T')[0] : '';
    }
    return String(val || '');
  }

  const handleSave = async () => {
    if (value === originalValue) {
      onCancel?.();
      return;
    }

    setIsLoading(true);
    try {
      let processedValue: any = value;
      
      // Process value based on field type
      if (field === 'estimatedHours' || field === 'actualHours') {
        processedValue = parseFloat(value) || 0;
      } else if (field === 'dueDate' || field === 'startDate') {
        processedValue = value ? new Date(value).toISOString() : null;
      }

      await onUpdate(task._id, { [field]: processedValue });
      showSuccess(`Task ${field} updated successfully`);
      onCancel?.();
    } catch (error) {
      showError(`Failed to update task ${field}`);
      setValue(originalValue); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(originalValue);
      onCancel?.();
    }
  };

  const renderInput = () => {
    const baseClasses = `w-full px-2 py-1 text-sm border border-indigo-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 ${className}`;

    switch (field) {
      case 'title':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={baseClasses}
            placeholder="Task title"
            maxLength={200}
          />
        );

      case 'description':
        return (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${baseClasses} resize-none`}
            placeholder="Task description"
            rows={3}
            maxLength={1000}
          />
        );

      case 'status':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={baseClasses}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
          </select>
        );

      case 'priority':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={baseClasses}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        );

      case 'dueDate':
      case 'startDate':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={baseClasses}
          />
        );

      case 'estimatedHours':
      case 'actualHours':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            min="0"
            max="1000"
            step="0.5"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={baseClasses}
            placeholder="Hours"
          />
        );

      default:
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={baseClasses}
          />
        );
    }
  };

  return (
    <div className="relative">
      {renderInput()}
      
      {/* Action buttons */}
      <div className="flex items-center space-x-1 mt-1">
        <button
          onClick={handleSave}
          disabled={isLoading || value === originalValue}
          className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => {
            setValue(originalValue);
            onCancel?.();
          }}
          disabled={isLoading}
          className="px-2 py-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-xs rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
        >
          Cancel
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
        Press Enter to save, Esc to cancel
      </div>
    </div>
  );
}

// Hook for optimistic updates
export function useOptimisticTaskUpdate() {
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  const updateTaskOptimistically = async (
    taskId: string,
    updates: Partial<Task>,
    updateFunction: (taskId: string, updates: Partial<Task>) => Promise<Task>
  ) => {
    // Add to pending updates
    setPendingUpdates(prev => new Set(prev).add(taskId));

    // Apply optimistic update
    setOptimisticTasks(prev => 
      prev.map(task => 
        task._id === taskId ? { ...task, ...updates } : task
      )
    );

    try {
      // Perform actual update
      const updatedTask = await updateFunction(taskId, updates);
      
      // Update with server response
      setOptimisticTasks(prev => 
        prev.map(task => 
          task._id === taskId ? updatedTask : task
        )
      );
      
      return updatedTask;
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticTasks(prev => 
        prev.map(task => {
          if (task._id === taskId) {
            // Revert the changes
            const revertedTask = { ...task };
            Object.keys(updates).forEach(key => {
              delete (revertedTask as any)[key];
            });
            return revertedTask;
          }
          return task;
        })
      );
      throw error;
    } finally {
      // Remove from pending updates
      setPendingUpdates(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const setTasks = (tasks: Task[]) => {
    setOptimisticTasks(tasks);
  };

  return {
    tasks: optimisticTasks,
    pendingUpdates,
    updateTaskOptimistically,
    setTasks,
  };
}

// Inline editable field component
interface InlineEditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  field: string;
  type?: 'text' | 'textarea' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function InlineEditableField({
  value,
  onSave,
  field,
  type = 'text',
  options = [],
  placeholder,
  className = '',
  disabled = false,
}: InlineEditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
      showSuccess(`${field} updated successfully`);
    } catch (error) {
      showError(`Failed to update ${field}`);
      setEditValue(value); // Revert
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (disabled) {
    return <span className={`text-gray-500 dark:text-slate-400 ${className}`}>{value}</span>;
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className={`text-left hover:bg-gray-100 dark:hover:bg-slate-800 px-1 py-0.5 rounded transition-colors ${className}`}
        title={`Click to edit ${field}`}
      >
        {value || <span className="text-gray-400 italic">Click to edit</span>}
      </button>
    );
  }

  const inputClasses = "px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100";

  return (
    <div className="space-y-1">
      {type === 'select' ? (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClasses}
          autoFocus
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`${inputClasses} resize-none`}
          placeholder={placeholder}
          rows={2}
          autoFocus
        />
      ) : (
        <input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClasses}
          placeholder={placeholder}
          autoFocus
          {...(type === 'number' && { min: 0, max: 1000, step: 0.5 })}
        />
      )}
      
      <div className="flex space-x-1">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-2 py-0.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
        >
          {isLoading ? '...' : '✓'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="px-2 py-0.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-xs rounded transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Task row component with inline editing
interface TaskRowProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  className?: string;
}

export function EditableTaskRow({ task, onUpdate, className = '' }: TaskRowProps) {
  const [editingField, setEditingField] = useState<keyof Task | null>(null);

  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const handleFieldUpdate = async (field: keyof Task, newValue: string) => {
    let processedValue: any = newValue;
    
    if (field === 'estimatedHours' || field === 'actualHours') {
      processedValue = parseFloat(newValue) || 0;
    } else if (field === 'dueDate' || field === 'startDate') {
      processedValue = newValue ? new Date(newValue).toISOString() : null;
    }

    await onUpdate(task._id, { [field]: processedValue });
    setEditingField(null);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'todo': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'in_progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'review': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      'medium': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${className}`}>
      {/* Title */}
      <td className="px-6 py-4 whitespace-nowrap">
        {editingField === 'title' ? (
          <InlineTaskEditor
            task={task}
            onUpdate={onUpdate}
            onCancel={() => setEditingField(null)}
            field="title"
          />
        ) : (
          <InlineEditableField
            value={task.title}
            onSave={(newValue) => handleFieldUpdate('title', newValue)}
            field="title"
            placeholder="Task title"
          />
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        {editingField === 'status' ? (
          <InlineTaskEditor
            task={task}
            onUpdate={onUpdate}
            onCancel={() => setEditingField(null)}
            field="status"
          />
        ) : (
          <InlineEditableField
            value={task.status}
            onSave={(newValue) => handleFieldUpdate('status', newValue)}
            field="status"
            type="select"
            options={statusOptions}
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}
          />
        )}
      </td>

      {/* Priority */}
      <td className="px-6 py-4 whitespace-nowrap">
        <InlineEditableField
          value={task.priority}
          onSave={(newValue) => handleFieldUpdate('priority', newValue)}
          field="priority"
          type="select"
          options={priorityOptions}
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}
        />
      </td>

      {/* Assignee */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
        {task.assignedTo.name}
      </td>

      {/* Due Date */}
      <td className="px-6 py-4 whitespace-nowrap">
        <InlineEditableField
          value={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}
          onSave={(newValue) => handleFieldUpdate('dueDate', newValue)}
          field="dueDate"
          type="date"
        />
      </td>

      {/* Estimated Hours */}
      <td className="px-6 py-4 whitespace-nowrap">
        <InlineEditableField
          value={task.estimatedHours.toString()}
          onSave={(newValue) => handleFieldUpdate('estimatedHours', newValue)}
          field="estimatedHours"
          type="number"
          placeholder="0"
        />
      </td>

      {/* Actual Hours */}
      <td className="px-6 py-4 whitespace-nowrap">
        <InlineEditableField
          value={task.actualHours.toString()}
          onSave={(newValue) => handleFieldUpdate('actualHours', newValue)}
          field="actualHours"
          type="number"
          placeholder="0"
        />
      </td>
    </tr>
  );
}

// Bulk edit component
interface BulkEditProps {
  selectedTasks: string[];
  onBulkUpdate: (taskIds: string[], updates: Partial<Task>) => Promise<void>;
  onClose: () => void;
}

export function BulkTaskEditor({ selectedTasks, onBulkUpdate, onClose }: BulkEditProps) {
  const [updates, setUpdates] = useState<Partial<Task>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleBulkUpdate = async () => {
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await onBulkUpdate(selectedTasks, updates);
      showSuccess(`Updated ${selectedTasks.length} tasks`);
      onClose();
    } catch (error) {
      showError('Failed to update tasks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100 mb-4">
          Bulk Edit {selectedTasks.length} Tasks
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={updates.status || ''}
              onChange={(e) => setUpdates(prev => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            >
              <option value="">No change</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={updates.priority || ''}
              onChange={(e) => setUpdates(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            >
              <option value="">No change</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={handleBulkUpdate}
            disabled={isLoading || Object.keys(updates).length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isLoading ? 'Updating...' : 'Update Tasks'}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}