import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function usePushNotifications() {
  const { session } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Do not even attempt to load notifications in Expo Go to prevent crashes
    if (Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo') {
      console.log('Push notifications are bypassed in Expo Go on Android to prevent crashes. Use a development build.');
      return;
    }

    async function init() {
      // Dynamically import to prevent top-level module evaluation errors in Expo Go
      const Notifications = await import('expo-notifications');
      
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const token = await registerForPushNotificationsAsync(Notifications);
      if (token) {
        setExpoPushToken(token);
        
        supabase.from('push_tokens').upsert({
          user_id: session!.user!.id,
          token: token,
          updated_at: new Date().toISOString()
        }).then(({ error }) => {
          if (error) console.error("Error saving push token to Supabase:", error);
        });
      }
    }

    init();
  }, [session]);

  return expoPushToken;
}

async function registerForPushNotificationsAsync(Notifications: any) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    
    if (!projectId) {
      console.warn('EAS Project ID not found. You may need to run `eas init`.');
    }

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })).data;
    } catch (e: unknown) {
      console.error("Error getting Expo Push Token:", e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
