import '../global.css';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';
import { PurchasesProvider } from '@/hooks/usePurchases';

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);

  // Initialize push notifications
  usePushNotifications();

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

    // Define routes that are accessible to everyone (like the event guest page)
    const isPublic = !segments[0] || segments[0] === 'login' || segments[0] === 'index' || segments[0] === 'e';
    // Define routes that authenticated users shouldn't see (like login)
    const isAuthOnlyPrevented = !segments[0] || segments[0] === 'login' || segments[0] === 'index';

    if (!session && !isPublic) {
      // If unauthenticated and trying to access a protected route, go to login
      router.replace('/login');
    } else if (session && isAuthOnlyPrevented) {
      // If authenticated and trying to access a public onboarding route, go to dashboard
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
          <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
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
        <PurchasesProvider>
          <InitialLayout />
        </PurchasesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
