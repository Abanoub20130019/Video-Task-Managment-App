import toast from 'react-hot-toast';

// Success toast
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10B981',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
  });
};

// Error toast
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#EF4444',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
  });
};

// Warning toast
export const showWarning = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
    },
  });
};

// Info toast
export const showInfo = (message: string) => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
    },
  });
};

// Loading toast
export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
    style: {
      background: '#6B7280',
      color: '#fff',
    },
  });
};

// Dismiss toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Promise toast - automatically handles loading, success, and error states
export const showPromiseToast = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return toast.promise(promise, messages, {
    position: 'top-right',
    style: {
      minWidth: '250px',
    },
    success: {
      duration: 4000,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    },
    error: {
      duration: 5000,
      style: {
        background: '#EF4444',
        color: '#fff',
      },
    },
    loading: {
      style: {
        background: '#6B7280',
        color: '#fff',
      },
    },
  });
};

// Custom toast with custom styling
export const showCustomToast = (
  message: string,
  options?: {
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    icon?: string;
  }
) => {
  const { type = 'info', duration = 4000, position = 'top-right', icon } = options || {};
  
  const styles = {
    success: { background: '#10B981', color: '#fff' },
    error: { background: '#EF4444', color: '#fff' },
    warning: { background: '#F59E0B', color: '#fff' },
    info: { background: '#3B82F6', color: '#fff' },
  };

  return toast(message, {
    duration,
    position,
    icon,
    style: styles[type],
  });
};