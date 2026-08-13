import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X, Upload, Download, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases from 'react-native-purchases';
import { usePurchases } from '@/hooks/usePurchases';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

export default function PaywallScreen() {
  const router = useRouter();
  const { currentOffering } = usePurchases();
  const { user } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubscribe = async () => {
    if (!currentOffering?.monthly) {
      Alert.alert('Error', 'Subscription package not available right now. Please try again later.');
      return;
    }

    try {
      setIsPurchasing(true);
      const { customerInfo } = await Purchases.purchasePackage(currentOffering.monthly);
      
      if (customerInfo.entitlements.active['studio_access']) {
        // Update user profile in Supabase
        if (user) {
          const { error } = await supabase
            .from('profiles')
            .update({ is_studio_subscriber: true })
            .eq('id', user.id);
            
          if (error) {
            console.error("Failed to update profile", error);
            // Even if it failed here, they have the entitlement, they can restore later, or the app will eventually sync.
          }
        }
        
        Alert.alert('Welcome to the Studio!', 'Your subscription is active.');
        router.back();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Failed', e.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const customerInfo = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active['studio_access']) {
        if (user) {
          await supabase
            .from('profiles')
            .update({ is_studio_subscriber: true })
            .eq('id', user.id);
        }
        Alert.alert('Success', 'Your purchases have been restored.');
        router.back();
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active subscription for your account.');
      }
    } catch (e: any) {
      Alert.alert('Restore Failed', e.message);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Background Effect */}
      <View className="absolute inset-0 z-0">
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'transparent']}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 400 }}
        />
        <View className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-white/5 rounded-full blur-3xl" />
      </View>

      {/* Header */}
      <View className="flex-row justify-end px-6 pt-16 z-10">
        <Pressable 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 items-center justify-center active:scale-95 transition-transform"
        >
          <X size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 z-10" contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Badge */}
        <View className="self-center mb-8">
          <BlurView intensity={20} tint="light" className="flex-row items-center gap-2 px-4 py-2 rounded-full border border-white/20 overflow-hidden">
            <Sparkles size={12} color="rgba(255,255,255,0.8)" />
            <Text className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/80">For Photographers</Text>
          </BlurView>
        </View>

        {/* Title */}
        <View className="items-center mb-12">
          <Text className="font-serif text-5xl text-white tracking-tighter text-center mb-4">
            The <Text className="italic font-light text-white/80">Studio</Text>
          </Text>
          <Text className="text-base text-white/60 font-light text-center leading-relaxed px-4">
            A dedicated subscription platform for professional photographers to upload their high-resolution event galleries.
          </Text>
        </View>

        {/* Features */}
        <View className="gap-6 mb-16">
          <View className="glass p-8 rounded-3xl border border-white/10">
            <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-6">
              <Upload size={24} color="#fff" />
            </View>
            <Text className="font-serif text-2xl text-white mb-2">Upload High-Res</Text>
            <Text className="text-sm text-white/60 leading-relaxed">
              Say goodbye to compressed images. Upload your pristine, high-resolution edits directly to Captrd Studio. We preserve the quality of your work so it looks exactly as you intended.
            </Text>
          </View>

          <View className="glass p-8 rounded-3xl border border-white/10">
            <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-6">
              <Download size={24} color="#fff" />
            </View>
            <Text className="font-serif text-2xl text-white mb-2">Easy Downloads</Text>
            <Text className="text-sm text-white/60 leading-relaxed">
              Users and event guests can easily access the gallery and download the high-resolution pictures straight to their devices without jumping through hoops.
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View className="items-center mt-auto">
          <Pressable
            onPress={handleSubscribe}
            disabled={isPurchasing || !currentOffering}
            className={`w-full bg-white py-5 rounded-full items-center active:scale-[0.98] transition-transform ${(!currentOffering || isPurchasing) ? 'opacity-50' : ''}`}
            style={{
              shadowColor: '#fff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-sans font-medium uppercase tracking-widest text-sm">
                Subscribe {currentOffering?.monthly?.product?.priceString ? `for ${currentOffering.monthly.product.priceString}/mo` : 'Now'}
              </Text>
            )}
          </Pressable>

          <View className="flex-row items-center justify-center mt-6 gap-6">
            <Pressable onPress={handleRestore} disabled={isRestoring}>
              <Text className="text-white/40 text-xs uppercase tracking-wider font-medium">
                {isRestoring ? 'Restoring...' : 'Restore'}
              </Text>
            </Pressable>
            
            <View className="w-1 h-1 rounded-full bg-white/20" />
            
            <Pressable onPress={() => {}}>
              <Text className="text-white/40 text-xs uppercase tracking-wider font-medium">Terms</Text>
            </Pressable>

            <View className="w-1 h-1 rounded-full bg-white/20" />
            
            <Pressable onPress={() => {}}>
              <Text className="text-white/40 text-xs uppercase tracking-wider font-medium">Privacy</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
