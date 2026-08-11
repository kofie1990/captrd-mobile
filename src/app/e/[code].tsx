import { CameraViewfinder } from '@/components/CameraViewfinder';
import { FilmRollGallery } from '@/components/FilmRollGallery';
import storage from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import CaptrdLiveActivityFactory from '../../../widgets/CaptrdLiveActivity';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingState } from '@/components/ui/LoadingState';
import { containsProfanity } from '@/lib/moderation';

export default function EventPortalScreen() {
  const { code, gallery } = useLocalSearchParams();
  const router = useRouter();

  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [guestName, setGuestName] = useState('');
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [showGallery, setShowGallery] = useState(gallery === 'true');

  const [latestPhoto, setLatestPhoto] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchEvent = async () => {
      const eventId = Array.isArray(code) ? code[0] : code;
      if (!eventId) return;

      let query = supabase.from('events').select('*');
      if (eventId.length === 36) {
        query = query.eq('id', eventId);
      } else {
        query = query.eq('short_code', eventId.toLowerCase());
      }

      const { data, error } = await query.maybeSingle();

      if (data) {
        setEventData(data);

        // Fetch latest photo for thumbnail (matching web)
        const { data: latestPhotoData } = await supabase
          .from('photos')
          .select('storage_path')
          .eq('event_id', data.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (latestPhotoData && latestPhotoData.length > 0) {
          setLatestPhoto(latestPhotoData[0].storage_path);
        }

        // Check session storage for guest name
        try {
          const storedName = await storage.getItem(`captrd_guest_${data.id}`);
          if (storedName) {
            setGuestName(storedName);
            setHasEnteredName(true);
            
            // Re-start or update Live Activity if on iOS
            if (Platform.OS === 'ios') {
              try {
                if (CaptrdLiveActivityFactory.getInstances().length === 0) {
                  CaptrdLiveActivityFactory.start({
                    eventName: data.title,
                    picturesLeft: data.max_photos_per_user || 15
                  });
                }
              } catch (e) {
                console.error("Failed to start Live Activity", e);
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch guest name from storage", e);
        }
      }

      setLoading(false);
    };

    fetchEvent();
  }, [code]);
  useEffect(() => {
    return () => {
      if (Platform.OS === 'ios') {
        try {
          const instances = CaptrdLiveActivityFactory.getInstances();
          instances.forEach(instance => instance.end('default'));
        } catch (e) {
          console.error("Failed to clean up Live Activity", e);
        }
      }
    };
  }, []);

  const handleNameSubmit = async () => {
    if (guestName.trim()) {
      if (containsProfanity(guestName)) {
        Alert.alert("Invalid Name", "Please choose a different name to join this event.");
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        await storage.setItem(`captrd_guest_${eventData.id}`, guestName);
        setHasEnteredName(true);

        if (Platform.OS === 'ios') {
          try {
            if (CaptrdLiveActivityFactory.getInstances().length === 0) {
              CaptrdLiveActivityFactory.start({
                eventName: eventData.title,
                picturesLeft: eventData.max_photos_per_user || 15
              });
            }
          } catch (e) {
            console.error("Failed to start Live Activity", e);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.from("event_participants").upsert({
            user_id: session.user.id,
            event_id: eventData.id
          }, { onConflict: "user_id, event_id" });
        }
      } catch (e) {
        console.error("Failed to save guest name", e);
      }
    }
  };

  if (loading) {
    return showGallery ? <LoadingState.Grid /> : <LoadingState.Screen />;
  }

  if (!eventData) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />
        <Text className="font-serif text-3xl text-white mb-4 text-center">Roll Not Found</Text>
        <Text className="font-mono text-xs uppercase tracking-widest text-white/50 text-center mb-8">
          The code '{code}' doesn't match any active roll.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-white px-8 py-4 rounded-full active:scale-95 transition-transform"
        >
          <Text className="text-black font-mono text-xs uppercase tracking-widest font-bold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const isRevealed = new Date() >= new Date(eventData.reveal_at);
  const isEnded = eventData.end_at ? new Date() >= new Date(eventData.end_at) : false;

  if (showGallery && isRevealed) {
    return (
      <View className="flex-1 bg-[#09090b]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />
        <FilmRollGallery
          eventData={eventData}
          onViewCamera={() => setShowGallery(false)}
        />
      </View>
    );
  }

  if (isEnded && !showGallery) {
    return (
      <View className="flex-1 bg-black">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />

        {/* Background Cover Photo */}
        <Image
          source={{ uri: Platform.OS === 'android' && eventData.cover_photo_url ? eventData.cover_photo_url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : (eventData.cover_photo_url || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop") }}
          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.8 }}
          contentFit="cover"
        />

        {/* Dark Gradients for Text Readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000000']}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        <View className="flex-1 justify-end p-6 md:p-12 pb-12">
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-16 left-6 w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/20 active:scale-95"
            style={{ zIndex: 50 }}
          >
            <Text className="text-white text-center font-mono text-lg">←</Text>
          </Pressable>

          <View className="items-center">
            <Text className="font-serif text-5xl md:text-7xl text-white mb-4 text-center tracking-tight leading-tight">
              {eventData.title}
            </Text>

            <Text className="font-serif text-xl md:text-2xl text-white/90 italic text-center mb-8 px-4 leading-relaxed">
              Event has ended. Thank you for contributing to the experience.
            </Text>

            <Pressable
              onPress={() => setShowGallery(true)}
              className="w-full py-5 rounded-[2rem] bg-white shadow-xl active:scale-95 transition-transform max-w-sm"
            >
              <Text className="text-center font-mono font-bold uppercase tracking-widest text-xs text-black">
                Click here to see the event photos
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Camera Mode (or Guestbook if no name)
  if (!hasEnteredName) {
    return (
      <View className="flex-1 bg-black">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="light" />

        {/* Background Cover Photo */}
        <Image
          source={{ uri: Platform.OS === 'android' && eventData.cover_photo_url ? eventData.cover_photo_url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : (eventData.cover_photo_url || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop") }}
          style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.8 }}
          contentFit="cover"
        />

        {/* Dark Gradients for Text Readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000000']}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end p-6 md:p-12"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 12 }}
        >
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-16 left-6 w-10 h-10 rounded-full bg-white/10 items-center justify-center backdrop-blur-md border border-white/20 active:scale-95"
            style={{ zIndex: 50 }}
          >
            <Text className="text-white text-center font-mono text-lg">←</Text>
          </Pressable>

          <View className="items-center">
            {/* Event Title */}
            <Text className="font-serif text-5xl md:text-7xl text-white mb-4 text-center tracking-tight leading-tight">
              {eventData.title}
            </Text>

            {/* Event Date */}
            <Text className="font-mono text-xs text-white/80 uppercase tracking-[0.3em] mb-8 text-center">
              {new Date(eventData.reveal_at).toLocaleDateString()}
            </Text>

            {/* Custom Invite Details */}
            {eventData.invite_details && (
              <Text className="font-serif text-xl md:text-2xl text-white/90 italic text-center mb-12 px-4 leading-relaxed">
                "{eventData.invite_details}"
              </Text>
            )}

            {/* Form */}
            <View className="w-full max-w-sm gap-4">
              <TextInput
                placeholder="Enter your name to join"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={guestName}
                onChangeText={setGuestName}
                className="w-full bg-black/40 border border-white/20 rounded-[2rem] py-5 px-6 text-center text-white text-lg font-serif"
                style={{ backdropFilter: 'blur(10px)' }}
              />
              <Pressable
                onPress={handleNameSubmit}
                disabled={!guestName.trim()}
                className={`w-full py-5 rounded-[2rem] shadow-xl active:scale-95 transition-transform ${guestName.trim() ? 'bg-white' : 'bg-white/50'}`}
              >
                <Text className={`text-center font-mono font-bold uppercase tracking-widest text-xs ${guestName.trim() ? 'text-black' : 'text-black/50'}`}>
                  Join Film Roll
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <CameraViewfinder
        eventId={eventData.id}
        guestName={guestName}
        filter={eventData.aesthetic_filter}
        isRevealed={isRevealed}
        eventName={eventData.title}
        latestPhotoUrl={latestPhoto || undefined}
        onViewGallery={() => setShowGallery(true)}
        onPhotoTaken={(url) => setLatestPhoto(url)}
        maxPhotos={eventData.max_photos_per_user || 15}
      />
    </View>
  );
}
