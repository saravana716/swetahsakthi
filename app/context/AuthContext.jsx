import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, signInWithPhoneNumber } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        setIsProfileLoading(true);
        // Subscribe to real-time profile updates from Firestore
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile(null);
          }
          setIsProfileLoading(false);
        });

        return () => {
          unsubProfile();
        };
      } else {
        setUserProfile(null);
        setIsProfileLoading(false);
      }
    });

    return unsubAuth;
  }, []);

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
  };

  const logout = async () => {
    try {
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
      markSplashFinished: () => setIsSplashFinished(true),
      loginWithPhone, 
      updateProfile, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
