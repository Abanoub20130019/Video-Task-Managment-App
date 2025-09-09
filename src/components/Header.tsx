'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMenuOpen(false);
  }, [pathname]);

  if (status !== 'authenticated') {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Projects', href: '/projects', icon: '📋' },
    { name: 'Calendar', href: '/calendar', icon: '📅' },
    { name: 'Resources', href: '/resources', icon: '⚙️' },
    { name: 'Budget', href: '/budget', icon: '💰' },
    { name: 'Reports', href: '/reports', icon: '📊' },
    { name: 'Integrations', href: '/integrations', icon: '🔗' },
    { name: 'Equipment', href: '/equipment', icon: '🎥' },
    { name: 'Profile', href: '/profile', icon: '👤' },
    { name: 'Demo', href: '/demo', icon: '🚀' },
    { name: 'Clients', href: '/admin/clients', icon: '👥' },
  ];

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <header className="bg-gradient-to-r from-white via-gray-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-lg border-b border-gray-100 dark:border-slate-700 sticky top-0 z-50 backdrop-blur-md bg-white/95 dark:bg-slate-900/95">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          {/* Enhanced Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/dashboard"
              className="group flex items-center space-x-2 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <span className="text-white font-bold text-sm">VT</span>
              </div>
              <span className="hidden sm:block">VideoTask</span>
            </Link>
          </div>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = isActiveLink(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 group ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                      : 'text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-indigo-600 rounded-full"></div>
                  )}
                  <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    isActive ? 'bg-indigo-100 dark:bg-indigo-900/20' : 'bg-gray-100 dark:bg-slate-800'
                  }`}></div>
                </Link>
              );
            })}
          </nav>

          {/* Enhanced User Menu */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggle />
            {/* Enhanced User Info */}
            <div className="hidden md:flex items-center space-x-3 bg-white/80 dark:bg-slate-800/80 rounded-full px-3 py-1.5 shadow-sm border border-gray-100/50 dark:border-slate-700/50 backdrop-blur-sm">
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-800">
                  <span className="text-sm font-bold text-white">
                    {session.user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-tight">
                  {session.user?.name}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400 leading-tight">
                  {session.user?.role === 'admin' ? 'Administrator' : 'User'}
                </span>
              </div>
            </div>

            {/* Enhanced Sign Out Button */}
            <button
              onClick={() => signOut()}
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 border border-gray-200 dark:border-slate-600 hover:border-transparent rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>

            {/* Enhanced Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative p-2 text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                aria-label="Toggle mobile menu"
              >
                <div className="w-6 h-6 relative">
                  <span className={`absolute block w-5 h-0.5 bg-current transform transition-all duration-300 ${
                    isMenuOpen ? 'rotate-45 top-2.5' : 'top-1'
                  }`}></span>
                  <span className={`absolute block w-5 h-0.5 bg-current transform transition-all duration-300 top-2.5 ${
                    isMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}></span>
                  <span className={`absolute block w-5 h-0.5 bg-current transform transition-all duration-300 ${
                    isMenuOpen ? '-rotate-45 top-2.5' : 'top-4'
                  }`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 dark:border-slate-700 bg-gradient-to-b from-white/95 to-gray-50/95 dark:from-slate-900/95 dark:to-slate-800/95 shadow-lg backdrop-blur-md">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navigation.map((item) => {
                const isActive = isActiveLink(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm border border-indigo-100 dark:border-indigo-800'
                        : 'text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-indigo-600 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Enhanced Mobile User Section */}
            <div className="px-4 py-4 border-t border-gray-100 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-lg font-bold text-white">
                      {session.user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-gray-900 dark:text-slate-100 truncate">
                    {session.user?.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 truncate">
                    {session.user?.email}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                    {session.user?.role === 'admin' ? 'Administrator' : 'User'}
                  </div>
                </div>
              </div>

              {/* Mobile Sign Out Button */}
              <button
                onClick={() => signOut()}
                className="mt-4 w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 border border-red-200 dark:border-red-800 hover:border-transparent rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}