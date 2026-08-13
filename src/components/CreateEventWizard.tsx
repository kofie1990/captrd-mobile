import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Dimensions, KeyboardAvoidingView, Platform, Modal, Image as RNImage, Share, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { LoadingState } from '@/components/ui/LoadingState';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight } from 'react-native-reanimated';
import { ArrowRight, ArrowLeft, CheckCircle2, Upload, Sparkles, Image as ImageIcon, Edit3, X } from 'lucide-react-native';
import { CustomDatePicker } from './ui/CustomDatePicker';
import { CustomTimePicker } from './ui/CustomTimePicker';
import { CustomDropdown } from './ui/CustomDropdown';
import { supabase } from '@/lib/supabase';
import { AESTHETIC_FILTERS } from '@/lib/filters';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { usePurchases } from '@/hooks/usePurchases';
import Purchases from 'react-native-purchases';

const { width, height } = Dimensions.get('window');

const GUEST_TIERS = [
  { guests: 3, price: 0, maxPhotos: 5, rcPackageId: null },
  { guests: 5, price: 2.19, maxPhotos: 15, rcPackageId: 'tier_5' },
  { guests: 10, price: 3.19, maxPhotos: 20, rcPackageId: 'tier_10' },
  { guests: 15, price: 4.19, maxPhotos: 25, rcPackageId: 'tier_15' },
  { guests: 20, price: 5.19, maxPhotos: 30, rcPackageId: 'tier_20' },
  { guests: 30, price: 7.19, maxPhotos: 35, rcPackageId: 'tier_30' },
  { guests: 50, price: 12.99, maxPhotos: 40, rcPackageId: 'tier_50' },
  { guests: 100, price: 15.99, maxPhotos: 50, rcPackageId: 'tier_100' },
];

const PRESET_COVERS = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=90&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513151233558-d860c5398176?q=90&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=90&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=90&w=1200&auto=format&fit=crop",
];

const FILTER_PREVIEWS: Record<string, string> = {
  none: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  promist: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80",
  whitemist: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  roseglow: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  retrosoft: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80",
  vintage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80",
  bw: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80&sat=-100",
};

type Props = {
  userId: string;
  onEventCreated: (event: any) => void;
  onCancel: () => void;
};

export function CreateEventWizard({ userId, onEventCreated, onCancel }: Props) {
  const { currentOffering, isReady } = usePurchases();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(new Date());
  const [revealOption, setRevealOption] = useState("next_day");
  const [customRevealDate, setCustomRevealDate] = useState<Date | null>(new Date());
  const [customRevealTime, setCustomRevealTime] = useState<Date | null>(new Date());
  
  const [endOption, setEndOption] = useState("24_hours");
  const [customEndDate, setCustomEndDate] = useState<Date | null>(new Date());
  const [customEndTime, setCustomEndTime] = useState<Date | null>(new Date());
  
  const [guestTierIdx, setGuestTierIdx] = useState(0);
  const selectedTier = GUEST_TIERS[guestTierIdx];
  const [customMaxPhotos, setCustomMaxPhotos] = useState(selectedTier.maxPhotos.toString());

  const [filter, setFilter] = useState("none");

  const [coverType, setCoverType] = useState<"preset" | "upload">("preset");
  const [selectedPreset, setSelectedPreset] = useState(PRESET_COVERS[0]);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState("We can't wait to celebrate with you!");

  const [isEditingCover, setIsEditingCover] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  const [createdEvent, setCreatedEvent] = useState<any>(null);

  const generateShortCode = () => Math.random().toString(36).substring(2, 8).toLowerCase();

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 1 && !title.trim()) return;
    if (step === 2 && !eventDate) return;
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 1) {
      onCancel();
      return;
    }
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadedImagePreview(result.assets[0].uri);
      setCoverType("upload");
      setIsEditingCover(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // RevenueCat Purchase Flow
    if (selectedTier.price > 0 && selectedTier.rcPackageId) {
      if (!isReady || !currentOffering) {
        Alert.alert("Hold on", "We are still connecting to the App Store. Please try again in a moment.");
        setIsSubmitting(false);
        return;
      }

      const packageToBuy = currentOffering.availablePackages.find(p => p.identifier === selectedTier.rcPackageId);
      
      if (!packageToBuy) {
        Alert.alert("Error", "This tier is currently unavailable for purchase. Please check your connection or try a different tier.");
        setIsSubmitting(false);
        return;
      }

      try {
        if (Purchases) {
          await Purchases.purchasePackage(packageToBuy);
        } else {
          throw new Error('Purchases not available');
        }
      } catch (error: any) {
        if (!error.userCancelled) {
          Alert.alert("Purchase Failed", error.message || "There was an error processing your transaction.");
        }
        setIsSubmitting(false);
        return;
      }
    }

    let finalRevealAtStr = new Date().toISOString();

    if (revealOption === "custom" && customRevealDate && customRevealTime) {
      const finalDate = new Date(customRevealDate);
      finalDate.setHours(customRevealTime.getHours(), customRevealTime.getMinutes(), 0, 0);
      finalRevealAtStr = finalDate.toISOString();
    } else if (eventDate) {
      const date = new Date(eventDate.getTime());
      if (revealOption === "instantly") {
        finalRevealAtStr = date.toISOString();
      } else if (revealOption === "next_day") {
        date.setDate(date.getDate() + 1);
        date.setHours(9, 0, 0, 0);
        finalRevealAtStr = date.toISOString();
      }
    }

    let finalCoverUrl = selectedPreset;
    if (coverType === "upload" && uploadedImagePreview) {
      // In production, upload to Supabase Storage here.
      // For now, we fallback to local URI or preset if error.
      finalCoverUrl = uploadedImagePreview || selectedPreset;
    }

    let finalEndAtStr = new Date().toISOString();
    if (endOption === "custom" && customEndDate && customEndTime) {
      const finalEndDate = new Date(customEndDate);
      finalEndDate.setHours(customEndTime.getHours(), customEndTime.getMinutes(), 0, 0);
      finalEndAtStr = finalEndDate.toISOString();
    } else if (eventDate) {
      const date = new Date(eventDate.getTime());
      if (endOption === "24_hours") {
        date.setDate(date.getDate() + 1);
      } else if (endOption === "48_hours") {
        date.setDate(date.getDate() + 2);
      } else if (endOption === "1_week") {
        date.setDate(date.getDate() + 7);
      }
      finalEndAtStr = date.toISOString();
    }

    const maxPhotos = selectedTier.guests === 3 ? 5 : (parseInt(customMaxPhotos) || 10);

    const { data, error } = await supabase
      .from("events")
      .insert([{
        title,
        reveal_at: finalRevealAtStr,
        end_at: finalEndAtStr,
        aesthetic_filter: filter,
        admin_id: userId,
        short_code: generateShortCode(),
        max_photos_per_user: maxPhotos,
        cover_photo_url: finalCoverUrl,
        max_guests: selectedTier.guests,
        invite_details: inviteDetails
      }])
      .select()
      .single();

    if (!error && data) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCreatedEvent(data);
      setStep(8);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log('Error creating event:', error);
    }
    setIsSubmitting(false);
  };

  const currentCoverImage = coverType === "upload" && uploadedImagePreview ? uploadedImagePreview : selectedPreset;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View entering={direction > 0 ? SlideInRight : SlideInLeft} exiting={direction > 0 ? SlideOutLeft : SlideOutRight} className="flex-1 px-8 pt-12">
            <Text className="font-mono text-xs uppercase tracking-widest text-white/60 mb-3">Event Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Sarah's Wedding"
              placeholderTextColor="rgba(255,255,255,0.2)"
              className="w-full bg-transparent border-b border-white/20 py-2 text-2xl text-white font-serif mb-6"
              autoFocus
              onSubmitEditing={handleNext}
            />
            <Text className="text-white/40 text-sm font-serif italic">
              Give your film roll a name that guests will recognize when they scan the QR code to join.
            </Text>
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View entering={direction > 0 ? SlideInRight : SlideInLeft} exiting={direction > 0 ? SlideOutLeft : SlideOutRight} className="flex-1 px-8 pt-12">
            <CustomDatePicker label="Date of Event" selectedDate={eventDate} onSelect={setEventDate} />
            <Text className="text-white/40 text-sm font-serif italic mt-6">
              When is this event taking place? We'll use this date to manage your photo reveal timeline.
            </Text>
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View entering={direction > 0 ? SlideInRight : SlideInLeft} exiting={direction > 0 ? SlideOutLeft : SlideOutRight} className="flex-1 px-8 pt-12">
            <CustomDropdown
              label="When do photos reveal?"
              value={revealOption}
              onChange={setRevealOption}
              options={[
                { label: "Next Day at 9:00 AM", value: "next_day" },
                { label: "Instantly", value: "instantly" },
                { label: "Custom Time...", value: "custom" }
              ]}
            />
            {revealOption === 'custom' && (
              <Animated.View entering={FadeIn} className="mt-8 gap-6 border-t border-white/10 pt-8">
                <CustomDatePicker label="Reveal Date" selectedDate={customRevealDate} onSelect={setCustomRevealDate} />
                <CustomTimePicker label="Reveal Time" selectedTime={customRevealTime} onSelect={setCustomRevealTime} />
              </Animated.View>
            )}
          </Animated.View>
        );
      case 4:
        return (
          <Animated.View entering={direction > 0 ? SlideInRight : SlideInLeft} exiting={direction > 0 ? SlideOutLeft : SlideOutRight} className="flex-1 px-8 pt-12">
             <CustomDropdown
              label="When does the roll expire?"
              value={endOption}
              onChange={setEndOption}
              options={[
                { label: "24 Hours After Start", value: "24_hours" },
                { label: "48 Hours After Start", value: "48_hours" },
                { label: "1 Week After Start", value: "1_week" },
                { label: "Custom Date & Time...", value: "custom" }
              ]}
            />
            {endOption === 'custom' && (
              <Animated.View entering={FadeIn} className="mt-8 gap-6 border-t border-white/10 pt-8">
                <CustomDatePicker label="End Date" selectedDate={customEndDate} onSelect={setCustomEndDate} />
                <CustomTimePicker label="End Time" selectedTime={customEndTime} onSelect={setCustomEndTime} />
              </Animated.View>
            )}
            <Text className="text-white/40 text-sm font-serif italic mt-6">
              After this time, guests will no longer be able to take new photos.
            </Text>
          </Animated.View>
        );
      case 5:
        return (
          <Animated.View entering={direction > 0 ? SlideInRight : SlideInLeft} exiting={direction > 0 ? SlideOutLeft : SlideOutRight} className="flex-1 pt-12">
            <Text className="px-8 font-mono text-xs uppercase tracking-widest text-white/60 mb-4">Max Number of Guests</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              {GUEST_TIERS.map((tier, idx) => (
                <Pressable
                  key={tier.guests}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setGuestTierIdx(idx);
                    if (tier.guests === 3) setCustomMaxPhotos('5');
                    else setCustomMaxPhotos(tier.maxPhotos.toString());
                  }}
                  className={`mx-2 h-16 w-16 items-center justify-center rounded-2xl border ${guestTierIdx === idx ? 'bg-white border-white' : 'bg-transparent border-white/20'}`}
                  style={guestTierIdx === idx ? { shadowColor: '#fff', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 } : undefined}
                >
                  <Text className={`font-mono text-xl ${guestTierIdx === idx ? 'text-black font-bold' : 'text-white/60'}`}>{tier.guests}</Text>
                </Pressable>
              ))}
            </ScrollView>
            
            <View className="px-8 mt-4">
              <View className="p-5 bg-white/5 border border-white/10 rounded-2xl flex-row items-center justify-between mb-8">
                <View>
                  <Text className="font-serif text-xl text-white mb-1">Price</Text>
                  <Text className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                    {selectedTier.guests === 3 ? "Trial Tier" : "Premium Tier"}
                  </Text>
                </View>
                <Text className="font-serif text-3xl text-white">
                  {selectedTier.price === 0 ? "Free" : `$${selectedTier.price}`}
                </Text>
              </View>

              <Text className="font-mono text-xs uppercase tracking-widest text-white/60 mb-3">Max Photos Per Guest</Text>
              {selectedTier.guests === 3 ? (
                <View className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <Text className="font-mono text-xs text-white/50">Locked to 5 photos for the free tier.</Text>
                </View>
              ) : (
                <View>
                  <TextInput
                    keyboardType="numeric"
                    value={customMaxPhotos}
                    onChangeText={(text) => {
                      if (text === '') {
                        setCustomMaxPhotos('');
                        return;
                      }
                      const val = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      if (isNaN(val)) return;
                      if (val > selectedTier.maxPhotos) {
                        setCustomMaxPhotos(selectedTier.maxPhotos.toString());
                      } else {
                        setCustomMaxPhotos(val.toString());
                      }
                    }}
                    className="w-full bg-transparent border-b border-white/20 py-2 text-xl text-white font-serif"
                  />
                  <Text className="text-white/40 text-xs mt-2 font-mono uppercase tracking-widest">Max allowed for this tier: {selectedTier.maxPhotos}</Text>
                </View>
              )}
            </View>
          </Animated.View>
        );
      case 6:
        return (
          <Animated.View entering={direction > 0 ? SlideInRight : SlideInLeft} exiting={direction > 0 ? SlideOutLeft : SlideOutRight} className="flex-1 pt-12">
             <Text className="px-8 font-mono text-xs uppercase tracking-widest text-white/60 mb-6">Aesthetic Filter</Text>
             <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 32, paddingBottom: 16 }}>
               <View className="flex-row flex-wrap justify-between">
                {AESTHETIC_FILTERS.map((f) => (
                  <Pressable
                    key={f.id}
                    onPress={() => {
                       Haptics.selectionAsync();
                       setFilter(f.id);
                    }}
                    className="w-[48%] mb-4"
                  >
                    <View style={{ width: '100%', aspectRatio: 3/4, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: filter === f.id ? '#fff' : 'transparent', marginBottom: 8, backgroundColor: '#222' }}>
                      <RNImage source={{ uri: FILTER_PREVIEWS[f.id] || FILTER_PREVIEWS.none }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                    <Text className={`font-mono text-[10px] uppercase tracking-widest text-center ${filter === f.id ? 'text-white font-bold' : 'text-white/50'}`}>
                      {f.name}
                    </Text>
                  </Pressable>
                ))}
               </View>
               <Text className="text-white/40 text-sm font-serif italic text-center mt-4">
                  This aesthetic will be applied to all photos taken by your guests on this film roll.
               </Text>
             </ScrollView>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  if (step === 7) {
    return (
      <View className="flex-1 bg-black">
        <View className="absolute inset-0">
          <Pressable onPress={() => setIsEditingCover(true)} className="flex-1">
            <RNImage source={{ uri: currentCoverImage }} className="flex-1 opacity-70" />
            <View className="absolute inset-0 bg-black/30" />
            
            <View className="absolute top-24 self-center bg-black/50 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full flex-row items-center gap-2">
              <ImageIcon size={16} color="#fff" />
              <Text className="font-mono text-[10px] uppercase tracking-widest text-white font-medium">Tap to change cover</Text>
            </View>
          </Pressable>
        </View>

        <View pointerEvents="box-none" className="absolute top-0 left-0 right-0 pt-16 px-6 flex-row justify-between items-center z-20">
          <Pressable onPress={handleBack} className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full items-center justify-center pointer-events-auto">
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <View className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
            <Text className="font-mono text-[10px] uppercase tracking-widest text-white opacity-80">Preview Mode</Text>
          </View>
        </View>

        <View pointerEvents="box-none" className="absolute bottom-0 left-0 right-0 justify-end">
          <LinearGradient 
            colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']} 
            pointerEvents="none" 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View pointerEvents="box-none" className="p-8 pb-12 pt-32">
            <Text className="font-serif text-5xl text-white mb-2 tracking-tight shadow-black shadow-md">{title || "Event Title"}</Text>
            <Text className="font-mono text-xs uppercase tracking-widest text-white/80 mb-6">{eventDate ? format(eventDate, 'MMMM do, yyyy') : "Date"}</Text>

            <Pressable 
              onPress={() => setIsEditingDetails(true)}
              className="p-5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl mb-12 relative"
            >
              <Text className="font-serif italic text-white/90 leading-relaxed pr-8">"{inviteDetails}"</Text>
              <View className="absolute top-5 right-5 opacity-50">
                 <Edit3 size={16} color="#fff" />
              </View>
            </Pressable>

            <Pressable 
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-white py-4 rounded-full flex-row items-center justify-center gap-2 pointer-events-auto active:scale-95 transition-transform"
            >
              {isSubmitting ? (
                <LoadingState.Spinner size={16} />
              ) : (
                <>
                  <Text className="font-mono text-sm uppercase tracking-widest font-bold text-black">Publish Event</Text>
                  <Sparkles size={16} color="#000" />
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Cover Editor Bottom Sheet */}
        <Modal visible={isEditingCover} transparent animationType="slide" onRequestClose={() => setIsEditingCover(false)}>
          <View className="flex-1 justify-end">
            <Pressable className="absolute inset-0 bg-black/60" onPress={() => setIsEditingCover(false)} />
            <View className="bg-[#111] rounded-t-[2rem] p-8 pb-12 border-t border-white/10">
              <View className="flex-row justify-between items-center mb-8">
                <Text className="font-serif text-2xl text-white">Select Cover Art</Text>
                <Pressable onPress={() => setIsEditingCover(false)}><X size={24} color="#fff" /></Pressable>
              </View>

              <View className="flex-row flex-wrap justify-between mb-8">
                {PRESET_COVERS.map((url, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCoverType("preset");
                      setSelectedPreset(url);
                      setIsEditingCover(false);
                    }}
                    className={`w-[23%] aspect-[3/4] rounded-xl overflow-hidden border-2 ${coverType === 'preset' && selectedPreset === url ? 'border-white' : 'border-transparent opacity-50'}`}
                  >
                    <RNImage source={{ uri: url }} className="w-full h-full" />
                  </Pressable>
                ))}
              </View>

              <Pressable 
                onPress={pickImage}
                className="w-full py-5 rounded-2xl border border-dashed border-white/30 flex-row items-center justify-center gap-3 active:bg-white/5"
              >
                <Upload size={20} color="rgba(255,255,255,0.6)" />
                <Text className="font-mono text-xs uppercase tracking-widest text-white/60">Upload Custom Image</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Details Editor Modal */}
        <Modal visible={isEditingDetails} transparent animationType="fade" onRequestClose={() => setIsEditingDetails(false)}>
           <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-6">
             <Pressable className="absolute inset-0 bg-black/60" onPress={() => setIsEditingDetails(false)} />
             <View className="bg-[#111] rounded-[2rem] p-8 border border-white/10 shadow-2xl">
                <Text className="font-serif text-2xl text-white mb-6">Additional Details</Text>
                <TextInput
                  value={inviteDetails}
                  onChangeText={setInviteDetails}
                  multiline
                  numberOfLines={4}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white font-serif leading-relaxed mb-6 h-32"
                  autoFocus
                />
                <Pressable onPress={() => setIsEditingDetails(false)} className="w-full bg-white py-4 rounded-full items-center active:scale-95">
                   <Text className="font-mono text-xs uppercase tracking-widest font-bold text-black">Done</Text>
                </Pressable>
             </View>
           </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  if (step === 8 && createdEvent) {
    return (
      <View className="flex-1 bg-black justify-center items-center px-8">
        <View className="w-24 h-24 bg-white/10 border border-white/20 rounded-full items-center justify-center mb-8">
          <CheckCircle2 size={48} color="#fff" />
        </View>
        <Text className="font-serif text-4xl text-white mb-4">Roll Published!</Text>
        <Text className="font-mono text-xs uppercase tracking-widest text-white/60 text-center leading-relaxed mb-12">
          Your film roll is now live. Send the invite to your first guest to get started.
        </Text>
        
        <Pressable 
          onPress={async () => {
             Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
             await Share.share({
               message: `Join my film roll on Captrd: https://captrd.live/e/${createdEvent.short_code}`,
             });
          }}
          className="w-full bg-white py-4 rounded-full items-center mb-4 active:scale-95"
        >
          <Text className="font-mono text-xs uppercase tracking-widest font-bold text-black">Share Invite Link</Text>
        </Pressable>
        
        <Pressable 
          onPress={() => onEventCreated(createdEvent)}
          className="w-full bg-white/10 border border-white/20 py-4 rounded-full items-center active:scale-95"
        >
          <Text className="font-mono text-xs uppercase tracking-widest font-bold text-white">Go to Dashboard</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
        <View className="flex-1 pt-16 pb-10">
          <View className="px-8 flex-row justify-between items-center mb-8">
        <Text className="font-serif text-3xl text-white">New Film Roll</Text>
        <Text className="font-mono text-[10px] text-white/50 uppercase tracking-widest">Step {step} of 6</Text>
      </View>

      <View className="flex-1">
        {renderStep()}
      </View>

      <View className="px-8 pt-8 flex-row justify-between items-center border-t border-white/10">
        <Pressable onPress={handleBack} className="flex-row items-center gap-2 p-2 opacity-60 active:opacity-100">
          <ArrowLeft size={16} color="#fff" />
          <Text className="font-mono text-xs uppercase tracking-widest text-white">{step === 1 ? 'Cancel' : 'Back'}</Text>
        </Pressable>
        
        <Pressable 
          onPress={handleNext}
          disabled={step === 1 && !title.trim()}
          className={`flex-row items-center gap-2 bg-white px-6 py-3 rounded-full active:scale-95 ${step === 1 && !title.trim() ? 'opacity-30' : ''}`}
        >
          <Text className="font-mono text-xs uppercase tracking-widest font-bold text-black">Next</Text>
          <ArrowRight size={16} color="#000" />
        </Pressable>
      </View>
    </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
