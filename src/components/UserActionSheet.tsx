import React from 'react';
import { View, Text, Modal, Pressable, Platform, Alert } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface UserActionSheetProps {
  visible: boolean;
  onClose: () => void;
  guestName: string;
  onReport: () => void;
}

export function UserActionSheet({
  visible,
  onClose,
  guestName,
  onReport
}: UserActionSheetProps) {

  const handleReportPress = () => {
    onClose();
    // Use a small timeout to allow the action sheet to close before opening the modal
    setTimeout(onReport, 100);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} 
        onPress={onClose}
      >
        <View 
          className="bg-[#111] rounded-t-[2rem] border-t border-white/10 p-6 pb-12"
          onStartShouldSetResponder={() => true}
        >
          <View className="items-center mb-6">
            <View className="w-12 h-1 bg-white/20 rounded-full mb-4" />
            <Text className="font-serif text-xl text-white">{guestName}</Text>
          </View>

          <View className="gap-4">
            <Pressable 
              onPress={handleReportPress}
              className="bg-white/5 border border-white/10 p-4 rounded-2xl flex-row items-center justify-between active:bg-white/10 transition-colors"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-10 h-10 rounded-full bg-yellow-500/10 items-center justify-center">
                  <AlertTriangle size={20} color="#eab308" />
                </View>
                <View>
                  <Text className="font-sans text-white text-base font-bold">Report</Text>
                  <Text className="font-sans text-white/50 text-xs">Flag inappropriate behavior</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
