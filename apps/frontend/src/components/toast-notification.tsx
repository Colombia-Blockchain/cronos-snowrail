'use client';

import { useEffect, useState } from 'react';
import type { Notification } from '@cronos-x402/shared-types';

interface ToastNotificationProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  duration?: number; // milliseconds
}

export function ToastNotification({ notification, onDismiss, duration = 5000 }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slide in animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss after duration
    if (notification.dismissible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Match animation duration
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'critical':
        return 'bg-red-50 border-red-300 text-red-900';
      case 'high':
        return 'bg-orange-50 border-orange-300 text-orange-900';
      case 'medium':
        return 'bg-blue-50 border-blue-300 text-blue-900';
      case 'low':
        return 'bg-gray-50 border-gray-300 text-gray-900';
      default:
        return 'bg-white border-gray-300 text-gray-900';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border-2 ${getPriorityStyles()}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0 text-2xl">{notification.icon}</div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold">{notification.title}</p>
            <p className="mt-1 text-xs whitespace-pre-wrap">{notification.message}</p>

            {/* Actions */}
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex gap-2">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Handle action
                      console.log('Action clicked:', action);
                      handleDismiss();
                    }}
                    className={`
                      text-xs px-3 py-1 rounded font-medium
                      ${action.style === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600'}
                      ${action.style === 'secondary' && 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                      ${action.style === 'danger' && 'bg-red-500 text-white hover:bg-red-600'}
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Close button */}
          {notification.dismissible && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleDismiss}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Progress bar for auto-dismiss */}
        {notification.dismissible && duration > 0 && (
          <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-current"
              style={{
                animation: `shrink ${duration}ms linear`,
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
}

export function ToastContainer({ notifications, onDismiss, maxVisible = 5 }: ToastContainerProps) {
  // Show only the most recent notifications
  const visibleNotifications = notifications.slice(-maxVisible);

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      style={{ maxWidth: '400px' }}
    >
      {visibleNotifications.map((notification) => (
        <ToastNotification
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
