import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

type Props = {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  label?: string;
};

export function CustomDatePicker({ selectedDate, onSelect, label = "Date" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const nextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  const prevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleSelect = (date: Date) => {
    Haptics.selectionAsync();
    onSelect(date);
    setIsOpen(false);
  };

  return (
    <View className="w-full">
      <Text className="text-[10px] font-mono uppercase tracking-widest text-white/60 mb-2">{label}</Text>
      
      <Pressable 
        onPress={() => setIsOpen(true)}
        className="w-full border-b border-white/20 py-3 flex-row items-center justify-between active:opacity-70 transition-opacity"
      >
        <Text className={`text-lg ${selectedDate ? "text-white" : "text-white/40"}`}>
          {selectedDate ? format(selectedDate, "MMMM do, yyyy") : "Select a date"}
        </Text>
        <CalendarIcon size={20} color="rgba(255,255,255,0.4)" />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 justify-center items-center px-4">
          <Pressable className="absolute inset-0 bg-black/60" onPress={() => setIsOpen(false)} />
          
          <View className="w-full max-w-sm bg-[#111] rounded-[2rem] p-6 border border-white/10 shadow-2xl relative">
            <View className="flex-row justify-between items-center mb-6">
              <Pressable onPress={prevMonth} className="p-2 bg-white/5 rounded-full active:bg-white/10">
                <ChevronLeft size={20} color="#fff" />
              </Pressable>
              <Text className="font-serif text-xl text-white">{format(currentMonth, "MMMM yyyy")}</Text>
              <Pressable onPress={nextMonth} className="p-2 bg-white/5 rounded-full active:bg-white/10">
                <ChevronRight size={20} color="#fff" />
              </Pressable>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <View key={day} className="w-[14%] items-center mb-4">
                  <Text className="text-[10px] font-mono uppercase tracking-widest text-white/40">{day}</Text>
                </View>
              ))}
              
              {daysInMonth.map((date, i) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isCurrentDay = isToday(date);
                const isPast = isBefore(startOfDay(date), startOfDay(new Date()));

                return (
                  <Pressable
                    key={i}
                    disabled={isPast}
                    onPress={() => handleSelect(date)}
                    className={`w-[14%] aspect-square items-center justify-center rounded-full mb-1
                      ${!isCurrentMonth ? "opacity-20" : ""}
                      ${isPast ? "opacity-20" : "active:bg-white/10"}
                      ${isSelected && !isPast ? "bg-white" : ""}
                      ${isCurrentDay && !isSelected ? "border border-white/20" : ""}
                    `}
                  >
                    <Text className={`text-sm ${isSelected && !isPast ? 'text-black font-medium' : 'text-white'}`}>
                      {format(date, "d")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
