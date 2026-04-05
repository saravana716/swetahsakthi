import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, signInWithPhoneNumber } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from './NotificationContext';
import { storage } from '../../firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';

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
  
  const { expoPushToken } = useNotifications();

  // --- FULL DYNAMIC INTEGRATION: Sync Push Token to Firestore ---
  useEffect(() => {
    if (user && expoPushToken && expoPushToken !== 'no-token') {
      const userDocRef = doc(db, 'users', user.uid);
      setDoc(userDocRef, { 
        pushToken: expoPushToken,
        lastTokenSync: new Date().toISOString() 
      }, { merge: true })
      .then(() => console.log(`[AUTH_PROFILER] Push Token synced to Cloud: ${expoPushToken.slice(0, 10)}...`))
      .catch(err => console.error("[AUTH_PROFILER] Token sync failed:", err));
    }
  }, [user?.uid, expoPushToken]);

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
      let currentProfile = docSnap.exists() ? docSnap.data() : null;
      
      // LOGGING: Verify Cloud Photo Status
      if (currentProfile?.photoURL) {
        console.log(`[AUTH_PROFILER] Snapshot: Cloud Photo Link active: ${currentProfile.photoURL.slice(0, 30)}...`);
      }
      
      // DEEP RECOVERY: If Firestore doc is missing OR exists but has no name, check MongoDB
      if (!currentProfile || !currentProfile.displayName) {
        console.log(`[AUTH_PROFILER] Profile needs verification. Firestore Exists: ${!!currentProfile}.`);
        
        try {
          const token = await user.getIdToken();
          const allResponse = await fetch('http://13.63.202.142:5001/api/users', { 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (allResponse.ok) {
            const allUsersData = await allResponse.json();
            const userList = Array.isArray(allUsersData) ? allUsersData : (allUsersData?.data || []);
            
            console.log("\n================ [DEEP RECOVERY: MONGODB SEARCH] ================");
            console.log(`Found ${userList.length} total records. Searching for matches...`);
            console.log("=================================================================\n");

            const userPhoneBase = user.phoneNumber ? user.phoneNumber.slice(-10) : '';
            const existingUser = userList.find(u => {
              const uMobile = String(u.mobile || '');
              return uMobile === user.phoneNumber || (userPhoneBase && uMobile.includes(userPhoneBase));
            });
            
            if (existingUser && existingUser.name) {
              console.log(`[AUTH_PROFILER] Deep Recovery: Syncing profile for '${existingUser.name}'...`);
              const restoredData = {
                ...currentProfile, 
                displayName: existingUser.name,
                email: existingUser.email,
                photoURL: currentProfile?.photoURL || existingUser.photoURL || null, // ✅ PROTECT PHOTO
                appPin: existingUser.mpin || "1234",
                augmontUniqueId: existingUser.uniqueId || `USR${Date.now()}`,
                mongoId: existingUser._id,
                kycStatus: existingUser.kycStatus || 'pending',
                kycVerificationStatus: existingUser.kycVerificationStatus || 'pending',
                profileSetupComplete: true,
                uid: user.uid,
                phoneNumber: user.phoneNumber,
                recoveredAt: new Date().toISOString()
              };
              
              setUserProfile(restoredData);
              await setDoc(userDocRef, restoredData, { merge: true });
              setIsProfileLoading(false); 
              return; 
            }
          }
        } catch (err) {
          console.error("[AUTH_PROFILER] Deep recovery failed:", err);
        }
      }

      // If Firestore is already complete, just update the state
      setUserProfile(currentProfile);
      setIsProfileLoading(false);
    });

    return () => unsubProfile();
  }, [user?.uid]);

  // --- 🛡️ THE "CLOUDLOCK" AUTO-RECOVERY: Restore photo directly from Storage if missing ---
  useEffect(() => {
    if (user && !userProfile?.photoURL) {
      console.log("[AUTH_PROFILER] Auto-Recovery: Scanning Google Storage for photo...");
      const storageRef = ref(storage, `profile_photos/${user.uid}.jpg`);
      getDownloadURL(storageRef)
        .then((url) => {
          console.log("[AUTH_PROFILER] Auto-Recovery Success: Found photo. Restoring to Profile.");
          updateProfile({ photoURL: url }); 
        })
        .catch(() => {
          // No photo found in storage - this is normal for new users
          console.log("[AUTH_PROFILER] No pre-existing photo found in Storage.");
        });
    }
  }, [user?.uid, !!userProfile?.photoURL]);

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
