import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';

interface NotificationContextType {
  feedbackBanner: string | null;
  triggerFeedback: (message: string) => void;
  dismissFeedback: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFeedback = useCallback((message: string) => {
    setFeedbackBanner(message);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setFeedbackBanner((prev) => (prev === message ? null : prev));
    }, 4500);
  }, []);

  const dismissFeedback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setFeedbackBanner(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        feedbackBanner,
        triggerFeedback,
        dismissFeedback,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification deve ser utilizado dentro de um NotificationProvider');
  }
  return context;
}

