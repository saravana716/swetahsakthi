import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // 1. Skip all remote push logic in Expo Go (SDK 53/54 incompatibility)
    if (Constants.appOwnership === 'expo') {
      console.warn("Push notifications (remote) are not supported in Expo Go on SDK 53+. Using mock token.");
      setExpoPushToken('expo-go-mock-token');
      return;
    }

    // 2. ONLY attempt to import and use expo-notifications in a Development Build
    try {
      const Notifications = require('expo-notifications');
      
      // Standard configuration
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      registerForPushNotificationsAsync(Notifications).then(token => setExpoPushToken(token));

      const { useRouter } = require('expo-router');
      const router = useRouter();

      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
        console.log("[NOTIF] Foreground Received:", notification.request.content.title);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const { data } = response.notification.request.content;
        console.log("[NOTIF] Tapped. Data:", data);
        
        // Dynamic Routing: If the notification has a target screen, go there
        if (data?.screen === 'price-alerts' || data?.alertId) {
          router.push('/price-alerts');
        }
      });

      return () => {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
      };
    } catch (err) {
      console.error("Failed to load expo-notifications:", err);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

// --- HELPER TO GET PUSH TOKEN (Safe for Dev Clients) ---
async function registerForPushNotificationsAsync(Notifications) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Use the EAS project ID (Robust detection)
    let projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
        projectId = Constants?.easConfig?.projectId;
    }
    
    if (!projectId) {
      console.error("[NOTIF] Critical Error: EAS Project ID is missing from app.json/Constants.");
      return 'no-token';
    }
    
    try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("Push Token Registered:", token);
    } catch (e) {
        console.error("Error getting push token:", e);
    }
  }

  return token || 'no-token';
}
