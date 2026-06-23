import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { format, setHours, setMinutes } from 'date-fns';
import { Clock, ChevronUp, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type Props = {
  selectedTime: Date | null;
  onSelect: (time: Date) => void;
  label?: string;
};

export function CustomTimePicker({ selectedTime, onSelect, label = "Time" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(selectedTime || new Date());
  
  useEffect(() => {
    if (selectedTime) {
      setCurrentTime(selectedTime);
    }
  }, [selectedTime]);

  const currentHour12 = parseInt(format(currentTime, "h"), 10);
  const currentMinute = parseInt(format(currentTime, "m"), 10);
  const currentPeriod = format(currentTime, "a");

  const handleHourChange = (delta: number) => {
    Haptics.selectionAsync();
    let newHour12 = currentHour12 + delta;
    let newPeriod = currentPeriod;

    if (newHour12 > 12) {
      newHour12 = 1;
      newPeriod = newPeriod === "AM" ? "PM" : "AM";
    } else if (newHour12 < 1) {
      newHour12 = 12;
      newPeriod = newPeriod === "AM" ? "PM" : "AM";
    }

    let newHour24 = newHour12;
    if (newPeriod === "PM" && newHour12 !== 12) newHour24 += 12;
    if (newPeriod === "AM" && newHour12 === 12) newHour24 = 0;

    const updated = setHours(currentTime, newHour24);
    setCurrentTime(updated);
    onSelect(updated);
  };

  const handleMinuteChange = (delta: number) => {
    Haptics.selectionAsync();
    let newMinute = currentMinute + delta;
    let carryHour = 0;

    if (newMinute > 59) {
      newMinute = 0;
      carryHour = 1;
    } else if (newMinute < 0) {
      newMinute = 59;
      carryHour = -1;
    }

    let updated = setMinutes(currentTime, newMinute);
    if (carryHour !== 0) {
       updated = new Date(updated.getTime() + carryHour * 60 * 60 * 1000);
    }
    
    setCurrentTime(updated);
    onSelect(updated);
  };

  const togglePeriod = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let newHour24 = parseInt(format(currentTime, "H"), 10);
    if (currentPeriod === "AM") {
      newHour24 = (newHour24 + 12) % 24;
    } else {
      newHour24 = (newHour24 - 12 + 24) % 24;
    }
    const updated = setHours(currentTime, newHour24);
    setCurrentTime(updated);
    onSelect(updated);
  };

  return (
    <View className="w-full">
      <Text className="text-[10px] font-mono uppercase tracking-widest text-white/60 mb-2">{label}</Text>
      
      <Pressable 
        onPress={() => setIsOpen(true)}
        className="w-full border-b border-white/20 py-3 flex-row items-center justify-between active:opacity-70 transition-opacity"
      >
        <Text className={`text-lg ${selectedTime ? "text-white" : "text-white/40"}`}>
          {selectedTime ? format(selectedTime, "h:mm a") : "Select a time"}
        </Text>
        <Clock size={20} color="rgba(255,255,255,0.4)" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 justify-center items-center px-4">
          <Pressable className="absolute inset-0 bg-black/60" onPress={() => setIsOpen(false)} />
          
          <View className="bg-[#111] rounded-[2rem] p-8 border border-white/10 shadow-2xl relative w-full max-w-sm">
            <View className="flex-row items-center justify-between w-full">
              
              {/* Hours */}
              <View className="items-center">
                <Pressable onPress={() => handleHourChange(1)} className="p-3 mb-2 bg-white/5 rounded-full active:bg-white/10">
                  <ChevronUp size={24} color="#fff" />
                </Pressable>
                <View className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl items-center justify-center">
                  <Text className="font-serif text-4xl text-white">{currentHour12.toString().padStart(2, '0')}</Text>
                </View>
                <Pressable onPress={() => handleHourChange(-1)} className="p-3 mt-2 bg-white/5 rounded-full active:bg-white/10">
                  <ChevronDown size={24} color="#fff" />
                </Pressable>
              </View>

              <Text className="font-serif text-3xl text-white/50 mb-2">:</Text>

              {/* Minutes */}
              <View className="items-center">
                <Pressable onPress={() => handleMinuteChange(1)} className="p-3 mb-2 bg-white/5 rounded-full active:bg-white/10">
                  <ChevronUp size={24} color="#fff" />
                </Pressable>
                <View className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl items-center justify-center">
                  <Text className="font-serif text-4xl text-white">{currentMinute.toString().padStart(2, '0')}</Text>
                </View>
                <Pressable onPress={() => handleMinuteChange(-1)} className="p-3 mt-2 bg-white/5 rounded-full active:bg-white/10">
                  <ChevronDown size={24} color="#fff" />
                </Pressable>
              </View>

              {/* AM/PM */}
              <View className="h-full justify-center mt-2">
                <Pressable 
                  onPress={togglePeriod}
                  className="w-12 h-20 bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                >
                  <View className={`flex-1 items-center justify-center ${currentPeriod === 'AM' ? 'bg-white' : ''}`}>
                    <Text className={`font-mono text-[10px] uppercase tracking-widest ${currentPeriod === 'AM' ? 'text-black font-bold' : 'text-white/40'}`}>AM</Text>
                  </View>
                  <View className={`flex-1 items-center justify-center ${currentPeriod === 'PM' ? 'bg-white' : ''}`}>
                    <Text className={`font-mono text-[10px] uppercase tracking-widest ${currentPeriod === 'PM' ? 'text-black font-bold' : 'text-white/40'}`}>PM</Text>
                  </View>
                </Pressable>
              </View>

            </View>
            
            <Pressable 
              onPress={() => setIsOpen(false)}
              className="mt-8 bg-white py-4 rounded-full items-center justify-center active:scale-95 transition-transform"
            >
              <Text className="font-mono text-xs uppercase tracking-widest font-bold text-black">Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
