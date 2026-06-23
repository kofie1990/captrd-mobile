import React from 'react';
import { View, Text, Pressable, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface RollProps {
  id: string;
  title: string;
  reveal_at: string;
  cover_photo_url?: string;
  short_code: string;
}

export function RollCard({ 
  item, 
  onPressShare, 
  onPressManage, 
  onPressPreview,
  onPressCard,
  onPressCamera,
  isGuest = false
}: { 
  item: RollProps, 
  onPressShare: () => void, 
  onPressManage: () => void, 
  onPressPreview?: () => void,
  onPressCard?: () => void,
  onPressCamera?: () => void,
  isGuest?: boolean
}) {
  return (
    <Pressable 
      onPress={() => {
        if (onPressCard) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressCard();
        }
      }}
      className="w-full aspect-[4/5] rounded-[3rem] overflow-hidden bg-black shadow-2xl border border-white/10"
    >
      <Image
        source={{ uri: Platform.OS === 'android' && item.cover_photo_url ? item.cover_photo_url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : (item.cover_photo_url || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop") }}
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.6 }}
        contentFit="cover"
        transition={500}
      />
      
      <LinearGradient
        colors={['#00000000', '#00000099', '#000000E6']}
        className="absolute inset-0"
      />

      <View className="flex-1 p-6 justify-between">
        <View className="items-center mt-3">
          <Text className="text-white font-serif text-[28px] leading-tight mb-2 text-center" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-white/80 font-mono text-[10px] uppercase tracking-widest text-center">
            Reveals: {new Date(item.reveal_at).toLocaleDateString()}
          </Text>
        </View>

        <View className="gap-3 w-full">
          {isGuest ? (
            <Pressable 
              onPress={() => {
                if (onPressCamera) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPressCamera();
                } else if (onPressCard) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPressCard();
                }
              }}
              className="w-full bg-white py-3 rounded-full shadow-lg active:scale-95 transition-transform"
            >
              <Text className="text-black text-center font-mono text-[10px] font-bold uppercase tracking-widest">
                Open Camera
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onPressShare();
                }}
                className="w-full bg-white py-3 rounded-full shadow-lg active:scale-95 transition-transform"
              >
                <Text className="text-black text-center font-mono text-[10px] font-bold uppercase tracking-widest">
                  Share Invite
                </Text>
              </Pressable>
              
              <View className="flex-row gap-3">
                <Pressable 
                  onPress={() => {
                    if (onPressPreview) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onPressPreview();
                    }
                  }}
                  className="flex-1 border border-white/30 bg-white/5 py-3 rounded-full active:scale-95 transition-transform"
                >
                  <Text className="text-white text-center font-mono text-[10px] uppercase tracking-widest">
                    Preview
                  </Text>
                </Pressable>
                
                <Pressable 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPressManage();
                  }}
                  className="flex-1 border border-white/30 bg-white/5 py-3 rounded-full active:scale-95 transition-transform"
                >
                  <Text className="text-white text-center font-mono text-[10px] uppercase tracking-widest">
                    Manage
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}
