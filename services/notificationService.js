import Toast from 'react-native-toast-message';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import Constants from 'expo-constants';

/**
 * Trigger a real OS-level notification (Banner) if supported, 
 * and always show a Toast for immediate feedback.
 */
export async function sendLocalNotification(title, body, data = {}) {
  // 1. Show In-App Toast for immediate feedback (All Environments)
  Toast.show({
    type: 'success',
    text1: title,
    text2: body,
    visibilityTime: 5000,
    position: 'top',
  });

  // 2. Trigger OS-Level Banner (NOT supported in Expo Go on SDK 53+)
  if (Constants.appOwnership === 'expo') {
    console.log("Skipping OS-level banner in Expo Go. Real push notifications require a Development Build (APK).");
    return;
  }

  try {
    // Dynamic require to prevent the 'warnOfExpoGoPushUsage' top-level crash
    const Notifications = require('expo-notifications');
    
    // Set up handler if it hasn't been set yet
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
        data: data,
      },
      trigger: null, // trigger immediately
    });
  } catch (err) {
    console.error('Failed to trigger OS notification:', err);
  }
}

/**
 * Save a notification record to Firestore for the Notifications screen history.
 */
export async function saveNotificationToFirestore(uid, { title, message, icon, color }) {
  if (!uid) return;
  try {
    await addDoc(collection(db, 'users', uid, 'notifications'), {
      title,
      message,
      icon: icon || 'notifications',
      color: color || '#EAB308',
      unread: true,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to save notification to Firestore:', err);
  }
}
