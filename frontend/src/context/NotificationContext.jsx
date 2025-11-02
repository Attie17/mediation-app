import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const toggleNotificationPanel = () => {
    setIsNotificationPanelOpen(prev => !prev);
  };

  const openNotificationPanel = () => {
    setIsNotificationPanelOpen(true);
  };

  const closeNotificationPanel = () => {
    setIsNotificationPanelOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        isNotificationPanelOpen,
        toggleNotificationPanel,
        openNotificationPanel,
        closeNotificationPanel
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationPanel() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationPanel must be used within NotificationProvider');
  }
  return context;
}
