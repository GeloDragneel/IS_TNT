import toast from 'react-hot-toast';

/**
 * Show a basic toast notification
 */
export const showToast = (
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration: number = 4000,
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' = 'top-right'
) => {
  const toastOptions = {
    duration, // Toast duration in milliseconds
    position, // Toast position on screen
  };

  // Show the corresponding toast type
  if (type === 'success') {
    toast.success(message, toastOptions);
  } else if (type === 'error') {
    toast.error(message, toastOptions);
  } else {
    toast(message, toastOptions);
  }
};

/**
 * Show a success toast notification
 */
export const showSuccessToast = (message: string) => {showToast(message, 'success', 4000, 'top-center');};

/**
 * Show an error toast notification
 */
export const showErrorToast = (message: string) => {showToast(message, 'error', 4000, 'top-center');};

/**
 * Show an info toast notification
 */
export const showInfoToast = (message: string) => {showToast(message, 'info', 4000, 'top-center');};