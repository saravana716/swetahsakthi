import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// REPLACE THESE WITH YOUR ACTUAL VALUES FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyD7bA-bh21AlAd2b1awScTfxii3wFStTE0",
  authDomain: "swarna-sakhi-d2f01.firebaseapp.com",
  projectId: "swarna-sakhi-d2f01",
  storageBucket: "swarna-sakhi-d2f01.firebasestorage.app",
  messagingSenderId: "651056116299",
  appId: "1:651056116299:web:170280955cf9ca1b4cd3ce"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services with React Native Persistent Storage
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
export const db = getFirestore(app);

export default app;
