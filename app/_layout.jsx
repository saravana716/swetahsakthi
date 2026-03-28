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
  const { user, loading, isProfileLoading, isProfileComplete, isSplashFinished } = useAuth();
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

    if (user && !isProfileComplete && !isProfileSetup) {
      // Redirect to profile setup if authenticated but profile incomplete
      router.replace('/profile-setup');
    } else if (user && isProfileComplete && (inAuthGroup || isProfileSetup)) {
      // Redirect to the tabs if authenticated and profile complete
      router.replace('/(tabs)');
    } else if (!user && isSplash && isSplashFinished) {
      // Animation finished and user is purely unauthenticated -> force into intro flow
      router.replace('/get-started');
    } else if (!user && !inAuthGroup) {
      // Pure fallback security guard
      router.replace('/login');
    }
  }, [user, loading, isProfileLoading, isProfileComplete, segments, isSplashFinished]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="get-started" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="profile-setup" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="create-vault" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="choose-language" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="referral" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="buy" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="sell" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="referral-rewards" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}
