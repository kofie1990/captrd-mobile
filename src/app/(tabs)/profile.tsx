import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LogOut, Settings, User as UserIcon, Wand2, ExternalLink } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || 'Photographer';
  const email = user?.email || '';

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert("Error signing out", error.message);
    }
  };

  const openStudioSubscription = () => {
    Linking.openURL('https://captrd.live/studio');
  };

  return (
    <ScrollView 
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="light" />
      <View className="px-6 pt-24 pb-8">
        <Text className="font-serif text-4xl tracking-tight text-white mb-2">
          Profile
        </Text>
        <Text className="text-white/60 text-base font-sans mt-4">
          Manage your account and preferences.
        </Text>
      </View>

      <View className="px-6 gap-4">
        <View className="glass p-6 rounded-[2rem] border border-white/10 items-center">
          <View className="w-24 h-24 rounded-full bg-white/10 items-center justify-center mb-4">
            <UserIcon size={40} color="#fff" />
          </View>
          <Text className="font-serif text-2xl text-white mb-1">{userName}</Text>
          <Text className="font-mono text-[10px] uppercase tracking-widest text-white/50">{email}</Text>
        </View>

        <Pressable className="glass p-5 rounded-2xl flex-row items-center justify-between active:scale-[0.98] transition-transform">
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <Settings size={20} color="#fff" />
            </View>
            <Text className="font-sans text-white text-base">Account Settings</Text>
          </View>
        </Pressable>

        <Pressable 
          onPress={openStudioSubscription}
          className="glass p-5 rounded-2xl flex-row items-center justify-between active:scale-[0.98] transition-transform"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <Wand2 size={20} color="#fff" />
            </View>
            <View>
              <Text className="font-sans text-white text-base">Manage Studio Subscription</Text>
              <Text className="font-sans text-white/50 text-xs">captrd.live/studio</Text>
            </View>
          </View>
          <ExternalLink size={20} color="rgba(255,255,255,0.3)" />
        </Pressable>

        <Pressable 
          onPress={handleSignOut}
          className="glass p-5 rounded-2xl flex-row items-center justify-between active:scale-[0.98] transition-transform mt-8"
        >
          <View className="flex-row items-center gap-4">
            <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center">
              <LogOut size={20} color="#ff4444" />
            </View>
            <Text className="font-sans text-[#ff4444] text-base">Sign Out</Text>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}
