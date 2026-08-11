import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingState } from './ui/LoadingState';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
  title?: string;
  subtitle?: string;
}

const REASONS = [
  { id: 'inappropriate', label: 'Inappropriate Content' },
  { id: 'harassment', label: 'Harassment or Bullying' },
  { id: 'spam', label: 'Spam or Scam' },
  { id: 'other', label: 'Other' },
];

export function ReportModal({ 
  visible, 
  onClose, 
  onSubmit, 
  title = "Report", 
  subtitle = "Help us keep Captrd safe." 
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(selectedReason, details);
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setIsSubmitting(false);
    setIsSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-black/90 justify-center items-center p-6" style={{ backdropFilter: 'blur(10px)' }}>
          <View className="w-full max-w-md bg-[#111] rounded-[2rem] border border-white/10 overflow-hidden">
            
            <View className="flex-row items-center justify-between p-6 border-b border-white/5">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center">
                  <AlertTriangle size={20} color="#ff4444" />
                </View>
                <View>
                  <Text className="font-serif text-xl text-white">{title}</Text>
                  <Text className="font-mono text-[10px] uppercase tracking-widest text-white/50">{subtitle}</Text>
                </View>
              </View>
              
              {!isSubmitting && !isSuccess && (
                <Pressable onPress={handleClose} className="w-10 h-10 bg-white/5 rounded-full items-center justify-center">
                  <X size={20} color="#fff" />
                </Pressable>
              )}
            </View>

            {isSuccess ? (
              <View className="p-10 items-center justify-center">
                <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center mb-6">
                  <CheckCircle2 size={32} color="#22c55e" />
                </View>
                <Text className="font-serif text-2xl text-white mb-2 text-center">Report Submitted</Text>
                <Text className="font-sans text-sm text-white/60 text-center">
                  Thank you for helping keep Captrd safe. We will review this within 24 hours.
                </Text>
              </View>
            ) : (
              <ScrollView className="max-h-[70vh]">
                <View className="p-6 gap-6">
                  <View>
                    <Text className="font-sans text-sm text-white mb-4">Why are you reporting this?</Text>
                    <View className="gap-2">
                      {REASONS.map((r) => (
                        <Pressable 
                          key={r.id}
                          onPress={() => setSelectedReason(r.id)}
                          className={`p-4 rounded-2xl border flex-row items-center justify-between ${
                            selectedReason === r.id 
                              ? 'bg-red-500/20 border-red-500/50' 
                              : 'bg-white/5 border-white/5'
                          }`}
                        >
                          <Text className={`font-sans text-sm ${selectedReason === r.id ? 'text-red-400 font-bold' : 'text-white/80'}`}>
                            {r.label}
                          </Text>
                          {selectedReason === r.id && (
                            <View className="w-4 h-4 rounded-full bg-red-500" />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {selectedReason === 'other' && (
                    <View>
                      <Text className="font-sans text-sm text-white mb-3">Additional Details (Optional)</Text>
                      <TextInput
                        className="bg-black/50 border border-white/10 rounded-2xl p-4 text-white font-sans min-h-[100px]"
                        placeholder="Please provide more context..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        multiline
                        textAlignVertical="top"
                        value={details}
                        onChangeText={setDetails}
                      />
                    </View>
                  )}

                  {error && (
                    <Text className="text-red-400 font-sans text-xs text-center">{error}</Text>
                  )}

                  <Pressable 
                    disabled={!selectedReason || isSubmitting}
                    onPress={handleSubmit}
                    className={`mt-4 py-4 rounded-full items-center flex-row justify-center gap-2 ${
                      !selectedReason || isSubmitting ? 'bg-white/20' : 'bg-red-500'
                    }`}
                  >
                    {isSubmitting ? (
                      <LoadingState.Spinner size={16} />
                    ) : (
                      <Text className={`font-mono font-bold uppercase tracking-widest text-xs ${
                        !selectedReason ? 'text-white/40' : 'text-white'
                      }`}>
                        Submit Report
                      </Text>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
