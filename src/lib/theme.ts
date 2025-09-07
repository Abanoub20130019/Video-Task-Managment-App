'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function createThemeProvider() {
  return function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Initialize theme from localStorage
    useEffect(() => {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setThemeState(savedTheme);
      }
    }, []);

    // Update resolved theme based on theme preference and system preference
    useEffect(() => {
      const updateResolvedTheme = () => {
        let resolved: 'light' | 'dark';
        
        if (theme === 'system') {
          resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          resolved = theme;
        }
        
        setResolvedTheme(resolved);
        
        // Apply theme to document
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
        
        // Update CSS custom properties
        if (resolved === 'dark') {
          root.style.setProperty('--bg-primary', '#0f172a');
          root.style.setProperty('--bg-secondary', '#1e293b');
          root.style.setProperty('--bg-tertiary', '#334155');
          root.style.setProperty('--text-primary', '#f8fafc');
          root.style.setProperty('--text-secondary', '#cbd5e1');
          root.style.setProperty('--text-tertiary', '#94a3b8');
          root.style.setProperty('--border-primary', '#334155');
          root.style.setProperty('--border-secondary', '#475569');
          root.style.setProperty('--accent-primary', '#6366f1');
          root.style.setProperty('--accent-secondary', '#8b5cf6');
          root.style.setProperty('--success', '#10b981');
          root.style.setProperty('--warning', '#f59e0b');
          root.style.setProperty('--error', '#ef4444');
          root.style.setProperty('--info', '#3b82f6');
        } else {
          root.style.setProperty('--bg-primary', '#ffffff');
          root.style.setProperty('--bg-secondary', '#f8fafc');
          root.style.setProperty('--bg-tertiary', '#f1f5f9');
          root.style.setProperty('--text-primary', '#0f172a');
          root.style.setProperty('--text-secondary', '#334155');
          root.style.setProperty('--text-tertiary', '#64748b');
          root.style.setProperty('--border-primary', '#e2e8f0');
          root.style.setProperty('--border-secondary', '#cbd5e1');
          root.style.setProperty('--accent-primary', '#6366f1');
          root.style.setProperty('--accent-secondary', '#8b5cf6');
          root.style.setProperty('--success', '#10b981');
          root.style.setProperty('--warning', '#f59e0b');
          root.style.setProperty('--error', '#ef4444');
          root.style.setProperty('--info', '#3b82f6');
        }
      };

      updateResolvedTheme();

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (theme === 'system') {
          updateResolvedTheme();
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
    };

    return {
      theme,
      setTheme,
      resolvedTheme,
      children,
      ThemeContext,
    };
  };
}

// Export the provider
export const ThemeProvider = createThemeProvider();

// Theme toggle hook
export function useThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIconPath = () => {
    if (theme === 'system') {
      return "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z";
    } else if (resolvedTheme === 'dark') {
      return "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z";
    } else {
      return "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
    }
  };

  const getTooltip = () => {
    if (theme === 'system') return 'System theme';
    return theme === 'light' ? 'Light theme' : 'Dark theme';
  };

  return {
    mounted,
    theme,
    resolvedTheme,
    toggleTheme,
    getIconPath,
    getTooltip,
  };
}

// Utility function to get theme-aware classes
export function getThemeClasses(lightClass: string, darkClass: string) {
  return `${lightClass} dark:${darkClass}`;
}

// Theme-aware color utilities
export const themeColors = {
  bg: {
    primary: 'bg-white dark:bg-slate-900',
    secondary: 'bg-gray-50 dark:bg-slate-800',
    tertiary: 'bg-gray-100 dark:bg-slate-700',
  },
  text: {
    primary: 'text-gray-900 dark:text-slate-100',
    secondary: 'text-gray-600 dark:text-slate-300',
    tertiary: 'text-gray-500 dark:text-slate-400',
  },
  border: {
    primary: 'border-gray-200 dark:border-slate-700',
    secondary: 'border-gray-300 dark:border-slate-600',
  },
  hover: {
    bg: 'hover:bg-gray-50 dark:hover:bg-slate-800',
    text: 'hover:text-gray-900 dark:hover:text-slate-100',
  },
};