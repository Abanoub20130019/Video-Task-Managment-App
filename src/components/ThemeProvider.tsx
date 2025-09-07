'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  // Update resolved theme based on theme preference and system preference
  useEffect(() => {
    if (!mounted) return;

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
      
      // Enhanced CSS custom properties for better dark mode
      if (resolved === 'dark') {
        root.style.setProperty('--background', '#0a0a0a');
        root.style.setProperty('--foreground', '#ededed');
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
        root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.3)');
        root.style.setProperty('--shadow-lg', 'rgba(0, 0, 0, 0.4)');
        root.style.setProperty('--navbar-bg', 'rgba(15, 23, 42, 0.95)');
        root.style.setProperty('--navbar-border', 'rgba(51, 65, 85, 0.8)');
      } else {
        root.style.setProperty('--background', '#ffffff');
        root.style.setProperty('--foreground', '#171717');
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
        root.style.setProperty('--shadow', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--shadow-lg', 'rgba(0, 0, 0, 0.15)');
        root.style.setProperty('--navbar-bg', 'rgba(255, 255, 255, 0.95)');
        root.style.setProperty('--navbar-border', 'rgba(226, 232, 240, 0.8)');
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
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Theme toggle hook for easier usage
export function useThemeToggle() {
  const { theme, setTheme, resolvedTheme, mounted } = useTheme();

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