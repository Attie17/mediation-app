import toast from 'react-hot-toast';

// Default configuration
const defaultOptions = {
  duration: 4000,
  style: {
    background: '#1e293b', // slate-800
    color: '#fff',
    border: '1px solid #334155', // slate-700
    borderRadius: '0.5rem',
    padding: '12px 16px',
  },
  success: {
    iconTheme: {
      primary: '#14b8a6', // teal-500
      secondary: '#fff',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444', // red-500
      secondary: '#fff',
    },
  },
};

export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      ...defaultOptions,
      ...defaultOptions.success,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      ...defaultOptions,
      ...defaultOptions.error,
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        ...defaultOptions,
        ...options,
      }
    );
  },

  custom: (message, options = {}) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
    });
  },

  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

export default showToast;
