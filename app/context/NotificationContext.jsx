import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [promoEnabled, setPromoEnabled] = useState(true);
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [orderEnabled, setOrderEnabled] = useState(true);

  const toggleNotifications = () => setNotificationsEnabled(prev => !prev);
  const togglePromos = () => setPromoEnabled(prev => !prev);
  const toggleAlerts = () => setAlertEnabled(prev => !prev);
  const toggleOrders = () => setOrderEnabled(prev => !prev);

  return (
    <NotificationContext.Provider value={{
      notificationsEnabled,
      promoEnabled,
      alertEnabled,
      orderEnabled,
      toggleNotifications,
      togglePromos,
      toggleAlerts,
      toggleOrders
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
