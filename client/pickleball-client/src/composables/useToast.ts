import { useToast as useVueToast } from 'vue-toast-notification';
import { useI18n } from 'vue-i18n';

export interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  dismissible?: boolean;
  onClick?: () => void;
  onDismiss?: () => void;
}

export function useToast() {
  const toast = useVueToast();
  const { t } = useI18n();

  const defaultOptions: ToastOptions = {
    duration: 5000,
    position: 'top-right',
    dismissible: true
  };

  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  };

  const info = (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
  };

  const warning = (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...defaultOptions, ...options });
  };

  const apiError = (error: any, fallbackMessage?: string) => {
    let errorMessage = fallbackMessage || t('errors.serverError');
    
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage, defaultOptions);
  };

  return {
    success,
    error,
    info,
    warning,
    apiError
  };
}
