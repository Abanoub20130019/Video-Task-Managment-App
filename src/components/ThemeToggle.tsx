'use client';

import { useThemeToggle } from '@/components/ThemeProvider';

export default function ThemeToggle() {
  const { mounted, theme, resolvedTheme, toggleTheme, getIconPath, getTooltip } = useThemeToggle();

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-slate-600/50 backdrop-blur-sm"
      title={getTooltip()}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
    >
      <div className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath()} />
        </svg>
      </div>
      
      {/* Theme indicator dot */}
      <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full transition-colors duration-200 ${
        theme === 'system' 
          ? 'bg-blue-500' 
          : resolvedTheme === 'dark' 
            ? 'bg-purple-500' 
            : 'bg-yellow-500'
      }`}></div>
    </button>
  );
}