import '../global.css';
import { Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';

import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_400Regular, PlayfairDisplay_400Regular_Italic } from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);

  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && !loading) {
      setIsAppReady(true);
    }
  }, [loaded, loading]);

  useEffect(() => {
    if (!loaded || loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inEventGroup = segments[0] === 'e';
    const inManageGroup = segments[0] === 'manage';
    const inCreateGroup = segments[0] === 'create';

    if (!session && (inAuthGroup || inManageGroup || inCreateGroup)) {
      // Redirect to login if unauthenticated
      router.replace('/login');
    } else if (session && !inAuthGroup && !inEventGroup && !inManageGroup && !inCreateGroup) {
      // Redirect to dashboard if authenticated (unless they are viewing an event, managing, or creating)
      router.replace('/(tabs)/dashboard');
    }
  }, [session, loading, loaded, segments]);

  useEffect(() => {
    // Hide native splash screen quickly, our custom one is already rendering
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      {isAppReady && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="create" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="e/[code]" />
          <Stack.Screen name="manage/[id]" />
        </Stack>
      )}
      {(!isAppReady || !isSplashAnimationComplete) && (
        <CustomSplashScreen 
          onFinish={() => setIsSplashAnimationComplete(true)} 
        />
      )}
    </ThemeProvider>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setHidden(true);
      SystemUI.setBackgroundColorAsync('#000000');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <InitialLayout />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
