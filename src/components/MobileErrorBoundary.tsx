'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isMobile: boolean;
}

export default class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isMobile: false
    };
  }

  componentDidMount() {
    // Detect mobile device
    const isMobile = window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.setState({ isMobile });

    // Add mobile-specific error handlers
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mobile Error Boundary caught an error:', error, errorInfo);
    
    // Log mobile-specific error details
    const mobileInfo = {
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
      memory: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : 'unavailable'
    };

    console.error('Mobile device info:', mobileInfo);
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Handle common mobile-specific promise rejections
    if (event.reason?.message?.includes('Canvas') || 
        event.reason?.message?.includes('WebGL') ||
        event.reason?.message?.includes('getUserMedia')) {
      this.setState({
        hasError: true,
        error: new Error('Mobile compatibility issue: ' + event.reason?.message)
      });
    }
  };

  handleGlobalError = (event: ErrorEvent) => {
    console.error('Global error:', event.error);
    
    // Handle canvas and WebGL errors specifically
    if (event.error?.message?.includes('Canvas') || 
        event.error?.message?.includes('WebGL') ||
        event.error?.message?.includes('out of memory')) {
      this.setState({
        hasError: true,
        error: event.error
      });
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isMobile } = this.state;
      const isCanvasError = error?.message?.includes('Canvas') || error?.message?.includes('WebGL');
      const isMemoryError = error?.message?.includes('memory') || error?.message?.includes('Memory');

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {isMobile ? 'Mobile App Error' : 'Application Error'}
                </h3>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {isCanvasError ? (
                  'The chart feature is not compatible with your device. The app will continue to work with table view instead.'
                ) : isMemoryError ? (
                  'Your device is running low on memory. Try closing other apps and refreshing the page.'
                ) : isMobile ? (
                  'Something went wrong with the mobile app. This might be due to device limitations or network issues.'
                ) : (
                  'An unexpected error occurred. Please try refreshing the page.'
                )}
              </p>
              
              {process.env.NODE_ENV === 'development' && error && (
                <details className="mt-3">
                  <summary className="text-xs text-gray-500 cursor-pointer">Technical Details</summary>
                  <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {error.message}
                    {error.stack && '\n\nStack trace:\n' + error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <button
                onClick={this.handleRetry}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reload Page
              </button>
            </div>

            {isMobile && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Mobile Tips:</strong> Try switching to table view for better performance, 
                      ensure you have a stable internet connection, and close other apps to free up memory.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}