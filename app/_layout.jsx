import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '@/app/context/LanguageContext';
import { NotificationProvider } from '@/app/context/NotificationContext';
import { ThemeProvider as AppThemeProvider } from '@/app/context/ThemeContext';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import Toast from 'react-native-toast-message';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <NotificationProvider>
          <LanguageProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </LanguageProvider>
        </NotificationProvider>
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const { user, userProfile, loading, isProfileLoading, isProfileComplete, isSplashFinished, isMpinVerified } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loading || isProfileLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'get-started' || segments[0] === 'choose-language' || segments[0] === 'referral' || segments[0] === 'index' || segments.length === 0;
    const isProfileSetup = segments[0] === 'profile-setup';
    const isSplash = segments[0] === 'index' || segments.length === 0;

    // Don't redirect if we are currently on the splash screen and it hasn't finished yet
    if (isSplash && !isSplashFinished) return;

    // SCENARIO 1: Unauthenticated Users
    if (!user) {
      if (isSplash && isSplashFinished) {
        router.replace('/get-started'); // New installers go here
      } else if (!inAuthGroup) {
        router.replace('/login'); // Expired sessions fallback to login
      }
      return;
    }

    // SCENARIO 2: Incomplete Profiles (Registered but didn't finish Setup)
    // Only redirect if NOT loading, and we are CERTAIN there is no profile data
    if (!isProfileComplete) {
      console.log(`[NAV_TRACE] Redirecting to Profile Setup. Reason: ${!userProfile ? 'No Profile' : 'Missing displayName'}`);
      if (!isProfileSetup) {
        router.replace('/profile-setup');
      }
      return;
    }

    console.log(`[NAV_TRACE] Profile Verified: ${userProfile.displayName}. Checking security...`);

    // SCENARIO 3: Cold Boot Returning User (Profile complete, but session active. Demands MPIN)
    if (!isMpinVerified) {
      if (segments[0] !== 'verify-mpin') {
        router.replace('/verify-mpin');
      }
      return;
    }

    // SCENARIO 4: Fully verified (OTP fresh, or MPIN verified). Drop them directly into Dashboard!
    if (inAuthGroup || isProfileSetup || segments[0] === 'verify-mpin') {
      router.replace('/(tabs)');
    }

  }, [user, loading, isProfileLoading, isProfileComplete, segments, isSplashFinished, isMpinVerified]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack 
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="get-started" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="verify-mpin" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile-setup" options={{ animation: 'fade' }} />
        <Stack.Screen name="create-vault" options={{ animation: 'fade' }} />
        <Stack.Screen name="choose-language" options={{ animation: 'fade' }} />
        <Stack.Screen name="referral" options={{ animation: 'fade' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="buy" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="sell" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="referral-rewards" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}
