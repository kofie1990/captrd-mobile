import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Wand2 } from 'lucide-react-native';

export default function StudioScreen() {
  return (
    <View className="flex-1 bg-black items-center justify-center p-6">
      <StatusBar style="light" />
      
      <View className="items-center bg-[#111] border border-white/10 rounded-[3rem] p-10 w-full">
        <View className="w-20 h-20 rounded-full bg-white/5 items-center justify-center mb-6 border border-white/5">
          <Wand2 size={36} color="#fff" strokeWidth={1.5} />
        </View>
        
        <Text className="font-serif text-3xl text-white mb-2 text-center">
          The Studio
        </Text>
        
        <View className="bg-white/10 px-4 py-1.5 rounded-full mb-8">
          <Text className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/80">
            Coming Soon
          </Text>
        </View>
        
        <Text className="text-white/50 font-sans text-center leading-relaxed text-sm px-2">
          We're brewing up something special. Soon you'll be able to craft custom film aesthetics and watermarks for your rolls.
        </Text>
      </View>
    </View>
  );
}
