'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '@/components/ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // Define default options
            className: '',
            duration: 4000,
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            },
            // Default options for specific types
            success: {
              duration: 3000,
              style: {
                background: 'var(--success)',
                color: '#fff',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: 'var(--error)',
                color: '#fff',
              },
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}