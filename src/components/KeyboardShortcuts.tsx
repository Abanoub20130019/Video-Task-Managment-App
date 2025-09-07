'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { showInfo } from '@/lib/toast';

interface ShortcutAction {
  key: string;
  description: string;
  action: () => void;
  category: string;
}

interface KeyboardShortcutsProps {
  onSearch?: () => void;
  onNewTask?: () => void;
  onNewProject?: () => void;
  className?: string;
}

export default function KeyboardShortcuts({ 
  onSearch, 
  onNewTask, 
  onNewProject,
  className = '' 
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  const shortcuts: ShortcutAction[] = [
    // Navigation
    { key: 'g d', description: 'Go to Dashboard', action: () => router.push('/dashboard'), category: 'Navigation' },
    { key: 'g p', description: 'Go to Projects', action: () => router.push('/projects'), category: 'Navigation' },
    { key: 'g c', description: 'Go to Calendar', action: () => router.push('/calendar'), category: 'Navigation' },
    { key: 'g r', description: 'Go to Resources', action: () => router.push('/resources'), category: 'Navigation' },
    { key: 'g b', description: 'Go to Budget', action: () => router.push('/budget'), category: 'Navigation' },
    { key: 'g e', description: 'Go to Equipment', action: () => router.push('/equipment'), category: 'Navigation' },
    
    // Actions
    { key: 'cmd+k', description: 'Search', action: () => onSearch?.(), category: 'Actions' },
    { key: 'n t', description: 'New Task', action: () => onNewTask?.(), category: 'Actions' },
    { key: 'n p', description: 'New Project', action: () => onNewProject?.(), category: 'Actions' },
    { key: '?', description: 'Show Shortcuts', action: () => setShowHelp(true), category: 'Help' },
    
    // Quick Actions
    { key: 'r', description: 'Refresh Page', action: () => window.location.reload(), category: 'Quick Actions' },
    { key: 'esc', description: 'Close Modals', action: () => setShowHelp(false), category: 'Quick Actions' },
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const isCmd = event.metaKey || event.ctrlKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // Handle modifier combinations
      if (isCmd && key === 'k') {
        event.preventDefault();
        onSearch?.();
        return;
      }

      // Handle single key shortcuts
      const shortcut = shortcuts.find(s => {
        if (s.key.includes('cmd+')) {
          return isCmd && s.key.replace('cmd+', '') === key;
        }
        if (s.key.includes(' ')) {
          // Handle sequence shortcuts (like 'g d')
          return false; // Implement sequence handling if needed
        }
        return s.key === key;
      });

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }

      // Special cases
      if (key === '?' && !isCmd && !isShift && !isAlt) {
        event.preventDefault();
        setShowHelp(true);
      }

      if (key === 'escape') {
        event.preventDefault();
        setShowHelp(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, onSearch, onNewTask, onNewProject]);

  // Show keyboard shortcuts help modal
  if (showHelp) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={() => setShowHelp(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-6">
            {Object.entries(
              shortcuts.reduce((acc, shortcut) => {
                if (!acc[shortcut.category]) acc[shortcut.category] = [];
                acc[shortcut.category].push(shortcut);
                return acc;
              }, {} as Record<string, ShortcutAction[]>)
            ).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut) => (
                    <div key={shortcut.key} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-slate-400">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 text-xs font-mono rounded border border-gray-300 dark:border-slate-600">
                        {shortcut.key.replace('cmd+', '⌘').replace('ctrl+', 'Ctrl+')}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">?</kbd> to toggle this help, 
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs ml-1">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Enhanced search and filter component
interface SearchAndFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: any) => void;
  placeholder?: string;
  filters?: {
    status?: string[];
    priority?: string[];
    assignee?: string[];
    dateRange?: { start: string; end: string };
  };
  className?: string;
}

export function EnhancedSearchAndFilter({ 
  onSearch, 
  onFilter, 
  placeholder = 'Search tasks...', 
  filters,
  className = '' 
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(filters || {});
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Global search shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchFocused(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // Debounced search
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleFilterChange = (filterType: string, value: any) => {
    const newFilters = { ...activeFilters, [filterType]: value };
    setActiveFilters(newFilters);
    onFilter(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    onFilter({});
    onSearch('');
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(v => 
      Array.isArray(v) ? v.length > 0 : v
    ).length;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className={`block w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ${
            searchFocused ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
          }`}
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-mono text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
              {getActiveFilterCount()}
            </span>
          )}
        </button>

        {getActiveFilterCount() > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <div className="space-y-2">
                {['todo', 'in_progress', 'review', 'completed'].map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFilters.status?.includes(status) || false}
                      onChange={(e) => {
                        const currentStatuses = activeFilters.status || [];
                        const newStatuses = e.target.checked
                          ? [...currentStatuses, status]
                          : currentStatuses.filter(s => s !== status);
                        handleFilterChange('status', newStatuses);
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-slate-400 capitalize">
                      {status.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Priority
              </label>
              <div className="space-y-2">
                {['low', 'medium', 'high'].map(priority => (
                  <label key={priority} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={activeFilters.priority?.includes(priority) || false}
                      onChange={(e) => {
                        const currentPriorities = activeFilters.priority || [];
                        const newPriorities = e.target.checked
                          ? [...currentPriorities, priority]
                          : currentPriorities.filter(p => p !== priority);
                        handleFilterChange('priority', newPriorities);
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-slate-400 capitalize">
                      {priority}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Due Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={activeFilters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...activeFilters.dateRange,
                    start: e.target.value
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="Start date"
                />
                <input
                  type="date"
                  value={activeFilters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...activeFilters.dateRange,
                    end: e.target.value
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Quick Filters
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    handleFilterChange('dateRange', { start: today, end: today });
                  }}
                  className="w-full text-left px-2 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                >
                  Due Today
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    handleFilterChange('dateRange', {
                      start: today.toISOString().split('T')[0],
                      end: nextWeek.toISOString().split('T')[0]
                    });
                  }}
                  className="w-full text-left px-2 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                >
                  Due This Week
                </button>
                <button
                  onClick={() => handleFilterChange('status', ['todo', 'in_progress'])}
                  className="w-full text-left px-2 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                >
                  Active Tasks
                </button>
                <button
                  onClick={() => handleFilterChange('priority', ['high'])}
                  className="w-full text-left px-2 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded"
                >
                  High Priority
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const isCmd = event.metaKey || event.ctrlKey;
      
      let shortcutKey = key;
      if (isCmd) shortcutKey = `cmd+${key}`;
      if (event.shiftKey) shortcutKey = `shift+${shortcutKey}`;
      if (event.altKey) shortcutKey = `alt+${shortcutKey}`;

      if (shortcuts[shortcutKey]) {
        event.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Command palette component
export function CommandPalette({ isOpen, onClose, commands }: {
  isOpen: boolean;
  onClose: () => void;
  commands: Array<{
    id: string;
    title: string;
    description?: string;
    action: () => void;
    icon?: string;
    category?: string;
  }>;
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[10vh] z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[60vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="w-full px-0 py-2 text-lg bg-transparent border-none focus:ring-0 focus:outline-none text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400"
            autoFocus
          />
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
              No commands found for "{query}"
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                onClick={() => {
                  command.action();
                  onClose();
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 border-b border-gray-100 dark:border-slate-700 last:border-b-0 ${
                  index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  {command.icon && (
                    <span className="text-lg">{command.icon}</span>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {command.title}
                    </div>
                    {command.description && (
                      <div className="text-xs text-gray-500 dark:text-slate-400">
                        {command.description}
                      </div>
                    )}
                  </div>
                  {command.category && (
                    <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {command.category}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}