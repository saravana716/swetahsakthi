import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LanguageProvider } from '@/app/context/LanguageContext';
import { NotificationProvider } from '@/app/context/NotificationContext';
import { ThemeProvider as AppThemeProvider } from '@/app/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <NotificationProvider>
          <LanguageProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack initialRouteName="index">
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="get-started" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="create-vault" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="choose-language" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="referral" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </LanguageProvider>
      </NotificationProvider>
    </AppThemeProvider>
  </SafeAreaProvider>
  );
}
