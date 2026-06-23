import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { CreateEventWizard } from '@/components/CreateEventWizard';
import { StatusBar } from 'expo-status-bar';

export default function CreateScreen() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <CreateEventWizard 
        userId={user.id}
        onEventCreated={() => {
          router.replace('/(tabs)/dashboard');
        }}
        onCancel={() => {
          router.back();
        }}
      />
    </View>
  );
}
