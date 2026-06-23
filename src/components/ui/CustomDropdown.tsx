import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type Option = { label: string; value: string };

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
};

export function CustomDropdown({ label, value, onChange, options }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(o => o.value === value) || options[0];

  const handleSelect = (val: string) => {
    Haptics.selectionAsync();
    onChange(val);
    setIsOpen(false);
  };

  return (
    <View className="w-full">
      <Text className="text-[10px] font-mono uppercase tracking-widest text-white/60 mb-2">{label}</Text>
      
      <Pressable 
        onPress={() => setIsOpen(true)}
        className="w-full border-b border-white/20 py-3 flex-row items-center justify-between active:opacity-70 transition-opacity"
      >
        <Text className="text-lg text-white">
          {selectedOption.label}
        </Text>
        <ChevronDown size={20} color="rgba(255,255,255,0.4)" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable className="absolute inset-0 bg-black/60" onPress={() => setIsOpen(false)} />
          
          <View className="bg-[#111] rounded-t-[2rem] border-t border-white/10 pb-8 pt-4 px-4 shadow-2xl max-h-[80%]">
            <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6" />
            <Text className="font-serif text-2xl text-white mb-6 px-4">{label}</Text>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  className={`py-5 px-6 rounded-2xl mb-2 flex-row items-center justify-between ${option.value === value ? 'bg-white/10 border border-white/20' : 'active:bg-white/5'}`}
                >
                  <Text className={`text-lg ${option.value === value ? 'text-white font-medium' : 'text-white/70'}`}>
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <View className="w-2 h-2 rounded-full bg-white" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
