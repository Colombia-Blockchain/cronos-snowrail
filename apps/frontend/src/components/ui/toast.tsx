'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Toast types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 7000 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Toast Container
interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// Individual Toast
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const config = getToastConfig(toast.type);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
        animate-slide-in-right shadow-lg
        ${config.bg} ${config.border}
      `}
      role="alert"
    >
      <div className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`}>
        {config.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.titleColor}`}>
          {toast.title}
        </p>
        {toast.message && (
          <p className={`text-sm mt-1 ${config.messageColor}`}>
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={onClose}
        className={`flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors ${config.closeColor}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function getToastConfig(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
        iconColor: 'text-emerald-400',
        titleColor: 'text-emerald-300',
        messageColor: 'text-emerald-400/70',
        closeColor: 'text-emerald-400/50 hover:text-emerald-400',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      };
    case 'error':
      return {
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        iconColor: 'text-red-400',
        titleColor: 'text-red-300',
        messageColor: 'text-red-400/70',
        closeColor: 'text-red-400/50 hover:text-red-400',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      };
    case 'warning':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-300',
        messageColor: 'text-amber-400/70',
        closeColor: 'text-amber-400/50 hover:text-amber-400',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      };
    case 'info':
    default:
      return {
        bg: 'bg-brand-500/10',
        border: 'border-brand-500/20',
        iconColor: 'text-brand-400',
        titleColor: 'text-brand-300',
        messageColor: 'text-brand-400/70',
        closeColor: 'text-brand-400/50 hover:text-brand-400',
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      };
  }
}
