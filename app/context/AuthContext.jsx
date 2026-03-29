import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, signInWithPhoneNumber } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [isMpinVerified, setIsMpinVerified] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      // 1. Immediately reset profile-related states to prevent "navigation leak" 
      // when switching users or logging out.
      setIsProfileLoading(!!currentUser); 
      setUserProfile(null);
      setIsMpinVerified(false);
      
      setUser(currentUser);
      setLoading(false);
    });

    return unsubAuth;
  }, []);

  // Dedicated Profile Subscription Effect (Dependencies ensure it re-runs on UID change)
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setIsProfileLoading(false);
      return;
    }

    setIsProfileLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        setIsProfileLoading(false);
      } else {
        // Double-check MongoDB for orphaned accounts before declaring them "New"
        try {
          const token = await user.getIdToken();
          const allResponse = await fetch('http://13.63.202.142:5001/api/users', { 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (allResponse.ok) {
            const allUsersData = await allResponse.json();
            const userList = Array.isArray(allUsersData) ? allUsersData : (allUsersData?.data || []);
            // Try exact match or base 10-digit match in case of formatting differences
            const userPhoneBase = user.phoneNumber ? user.phoneNumber.slice(-10) : '';
            const existingUser = userList.find(u => 
              u.mobile === user.phoneNumber || 
              (userPhoneBase && u.mobile && u.mobile.includes(userPhoneBase))
            );
            
            if (existingUser && existingUser.name) {
              console.log("Auto-Restoring Firebase Profile...");
              const restoredData = {
                displayName: existingUser.name,
                email: existingUser.email,
                appPin: existingUser.mpin || "1234",
                augmontUniqueId: existingUser.uniqueId || `USR${Date.now()}`,
                mongoId: existingUser._id,
                profileSetupComplete: true,
                uid: user.uid,
                phoneNumber: user.phoneNumber
              };
              await setDoc(userDocRef, restoredData, { merge: true });
              return; 
            }
          }
        } catch (err) {
          console.error("Profile recovery check failed:", err);
        }

        // Truly a new user
        setUserProfile(null);
        setIsProfileLoading(false);
      }
    });

    return () => unsubProfile();
  }, [user?.uid]);

  const loginWithPhone = async (phoneNumber, recaptchaVerifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error("Phone sign-in error:", error);
      throw error;
    }
  };

  const updateProfile = async (data) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { ...data, uid: user.uid, phoneNumber: user.phoneNumber }, { merge: true });
    
    // Auto-verify MPIN for this active session if they just literally created it
    if (data.appPin) {
      setIsMpinVerified(true);
    }
  };

  const verifyMpin = (enteredPin) => {
    if (!userProfile) return false;
    
    // Support either Mongoose 'mpin' or Firestore 'appPin' terminology safely
    const storedPin = userProfile.appPin || userProfile.mpin;
    
    // Auto-verify if the pin exactly matches
    if (storedPin && storedPin === enteredPin) {
      return true;
    }
    
    // Fallback: If for some reason they don't have a PIN recorded in Firestore 
    // yet, auto-bypass to protect them from infinite locks
    if (!storedPin) {
      return true;
    }

    return false;
  };

  const logout = async () => {
    try {
      // 1. Clear session logic 
      setIsMpinVerified(false);
      setUserProfile(null);
      
      // 2. Wipe ALL local data as requested (AsyncStorage includes theme, language, etc.)
      await AsyncStorage.clear();
      
      // 3. Final Firebase Sign Out
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const isProfileComplete = userProfile && userProfile.displayName;

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isProfileLoading, 
      isProfileComplete, 
      isSplashFinished,
      isMpinVerified,
      setIsMpinVerified,
      markSplashFinished: () => setIsSplashFinished(true),
      loginWithPhone, 
      updateProfile, 
      verifyMpin,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
