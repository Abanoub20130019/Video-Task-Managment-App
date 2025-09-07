'use client';

import { useThemeToggle } from '@/lib/theme';

export default function ThemeToggle() {
  const { mounted, theme, toggleTheme, getIconPath, getTooltip } = useThemeToggle();

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse"></div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      title={getTooltip()}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
    >
      <div className="text-gray-600 dark:text-gray-300">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath()} />
        </svg>
      </div>
    </button>
  );
}