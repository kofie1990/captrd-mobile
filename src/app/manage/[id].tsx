import { useAuth } from '@/hooks/useAuth';
import { AESTHETIC_FILTERS } from '@/lib/filters';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Image as ImageIcon, Trash2, Unlock, UploadCloud, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

const FILTER_PREVIEWS: Record<string, string> = {
  none: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  promist: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80",
  whitemist: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
  roseglow: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
  retrosoft: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=300&q=80",
  vintage: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=300&q=80",
  bw: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80&sat=-100",
};

export default function ManageEventScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();

  const [eventData, setEventData] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [updatingFilter, setUpdatingFilter] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) {
        router.replace('/login');
        return;
      }

      const eventId = Array.isArray(id) ? id[0] : id;
      if (!eventId) return;

      const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single();
      if (event && event.admin_id !== session.user.id) {
        router.replace('/(tabs)/dashboard');
        return;
      }
      setEventData(event);

      const { data: fetchedPhotos } = await supabase.from('photos').select('*').eq('event_id', eventId).order('created_at', { ascending: false });
      if (fetchedPhotos) setPhotos(fetchedPhotos);

      setLoading(false);
    };
    fetchData();
  }, [id, session]);

  const forceReveal = async () => {
    Alert.alert(
      "Force Reveal?",
      "Are you sure you want to force reveal this roll to all guests immediately?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reveal",
          style: "destructive",
          onPress: async () => {
            const now = new Date().toISOString();
            const { error } = await supabase.from('events').update({ reveal_at: now }).eq('id', eventData.id);
            if (!error) {
              setEventData({ ...eventData, reveal_at: now });
              Alert.alert("Success", "Event has been revealed!");
            }
          }
        }
      ]
    );
  };

  const deleteEvent = async () => {
    Alert.alert(
      "Delete Roll?",
      "DANGER: Delete this entire event and all photos? This CANNOT be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (photos.length > 0) {
              const paths = photos.map(p => p.storage_path.split('/event-photos/')[1]).filter(Boolean);
              if (paths.length > 0) await supabase.storage.from('event-photos').remove(paths);
            }
            const { error } = await supabase.from('events').delete().eq('id', eventData.id);
            if (!error) {
              router.replace('/(tabs)/dashboard');
            }
          }
        }
      ]
    );
  };

  const deletePhoto = async (photo: any) => {
    Alert.alert(
      "Delete Photo?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const urlParts = photo.storage_path.split('/event-photos/');
            if (urlParts.length === 2) {
              const path = urlParts[1];
              await supabase.storage.from('event-photos').remove([path]);
            }
            const { error } = await supabase.from('photos').delete().eq('id', photo.id);
            if (!error) {
              setPhotos(photos.filter(p => p.id !== photo.id));
            }
          }
        }
      ]
    );
  };

  const handleCoverUpload = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setUploadingCover(true);
      try {
        const fileName = `${eventData.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('covers')
          .upload(fileName, decode(result.assets[0].base64), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName);

        const { error: dbError } = await supabase.from('events').update({ cover_photo_url: publicUrl }).eq('id', eventData.id);
        if (dbError) throw dbError;

        setEventData({ ...eventData, cover_photo_url: publicUrl });
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to upload cover photo.");
      } finally {
        setUploadingCover(false);
      }
    }
  };

  const handleFilterChange = async (filterId: string) => {
    if (filterId === eventData.aesthetic_filter) return;
    setUpdatingFilter(true);
    const { error } = await supabase.from('events').update({ aesthetic_filter: filterId }).eq('id', eventData.id);
    if (!error) {
      setEventData({ ...eventData, aesthetic_filter: filterId });
    } else {
      Alert.alert("Error", "Failed to update filter.");
    }
    setUpdatingFilter(false);
  };

  if (loading || !eventData) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const isRevealed = new Date() >= new Date(eventData.reveal_at);
  const guestStats = photos.reduce((acc: Record<string, number>, photo) => {
    acc[photo.guest_name] = (acc[photo.guest_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const uniqueGuests = Object.keys(guestStats).length;

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header / Cover */}
        <View className="relative w-full h-64 bg-[#111] overflow-hidden">
          {eventData.cover_photo_url ? (
            <Image
              source={{ uri: eventData.cover_photo_url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') }}
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              contentFit="cover"
            />
          ) : (
            <View className="absolute inset-0 items-center justify-center opacity-20">
              <ImageIcon size={48} color="#fff" />
            </View>
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', '#000']}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />

          <View className="absolute top-12 left-4 flex-row items-center justify-between right-4">
            <Pressable onPress={() => router.back()} className="w-10 h-10 bg-black/40 rounded-full items-center justify-center border border-white/20">
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <Pressable onPress={handleCoverUpload} disabled={uploadingCover} className="bg-black/40 rounded-full px-4 py-2 border border-white/20 flex-row items-center gap-2">
              {uploadingCover ? <ActivityIndicator size="small" color="#fff" /> : <UploadCloud size={16} color="#fff" />}
              <Text className="text-white font-mono text-[10px] uppercase tracking-widest">{uploadingCover ? 'Uploading...' : 'Update Cover'}</Text>
            </Pressable>
          </View>

          <View className="absolute bottom-6 left-6">
            <Text className="font-serif text-4xl text-white mb-1">{eventData.title}</Text>
            <Text className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
              {new Date(eventData.reveal_at).toLocaleDateString()} • {photos.length} Photos
            </Text>
          </View>
        </View>

        <View className="p-6 gap-8">

          {/* Status Card */}
          <View className="bg-[#111] border border-white/10 rounded-[2rem] p-6">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                {isRevealed ? <Unlock size={20} color="#fff" /> : <AlertTriangle size={20} color="#fbbf24" />}
              </View>
              <View>
                <Text className="font-serif text-xl text-white">Status</Text>
                <Text className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                  {isRevealed ? 'Revealed' : 'Developing'}
                </Text>
              </View>
            </View>

            {!isRevealed ? (
              <View className="bg-black/50 p-4 rounded-2xl mb-4 border border-white/5">
                <Text className="text-white/70 text-sm leading-relaxed font-sans mb-4">
                  This roll is still developing. Guests cannot see the photos until the reveal date.
                </Text>
                <Pressable onPress={forceReveal} className="bg-white py-3 rounded-full items-center active:scale-95 transition-transform">
                  <Text className="font-mono text-black font-bold uppercase tracking-widest text-xs">Force Reveal Now</Text>
                </Pressable>
              </View>
            ) : (
              <View className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <Text className="text-white/80 font-sans text-sm text-center">
                  This roll is fully revealed and visible to all guests.
                </Text>
              </View>
            )}
          </View>

          {/* Aesthetics Filter */}
          <View className="bg-[#111] border border-white/10 rounded-[2rem] py-6">
            <View className="px-6">
              <Text className="font-serif text-xl text-white mb-1">Aesthetic</Text>
              <Text className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-6">Choose a vibe</Text>
            </View>

            {updatingFilter && (
              <View className="absolute top-6 right-6 z-10">
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 16 }}>
                {AESTHETIC_FILTERS.map((filter) => {
                  const isSelected = eventData.aesthetic_filter === filter.id;
                  return (
                    <Pressable
                      key={filter.id}
                      onPress={() => handleFilterChange(filter.id)}
                      className={`items-center w-24 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-50'}`}
                    >
                      <View className={`w-full aspect-[3/4] rounded-xl mb-3 border-2 overflow-hidden items-center justify-center bg-[#222] transition-all duration-200 ${isSelected ? 'border-white scale-105 shadow-lg' : 'border-transparent scale-100'}`}>
                        <Image
                          source={{ uri: FILTER_PREVIEWS[filter.id] || FILTER_PREVIEWS.none }}
                          style={{ width: '100%', height: '100%', position: 'absolute' }}
                          contentFit="cover"
                        />
                      </View>
                      <Text className={`font-mono text-[10px] uppercase tracking-widest text-center ${isSelected ? 'text-white font-bold' : 'text-white/70'}`}>
                        {filter.name}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>

          {/* Guest Stats */}
          <View className="bg-[#111] border border-white/10 rounded-[2rem] p-6">
            <View className="flex-row items-center gap-3 mb-6">
              <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
                <Users size={20} color="#fff" />
              </View>
              <View>
                <Text className="font-serif text-xl text-white">Roster</Text>
                <Text className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                  {uniqueGuests} People Joined
                </Text>
              </View>
            </View>

            {Object.entries(guestStats).map(([name, count], index) => (
              <View key={index} className="flex-row justify-between items-center py-3 border-b border-white/5">
                <Text className="font-serif italic text-lg text-white">{name}</Text>
                <View className="bg-white/10 px-3 py-1 rounded-full">
                  <Text className="font-mono text-[10px] text-white/70">{String(count)} photos</Text>
                </View>
              </View>
            ))}

            {uniqueGuests === 0 && (
              <Text className="text-white/40 italic text-center py-4">No one has joined yet.</Text>
            )}
          </View>

          {/* Manage Photos Grid */}
          <View className="mt-4">
            <Text className="font-serif text-xl text-white mb-4">Manage Media</Text>
            {photos.length === 0 ? (
              <Text className="text-white/40 italic text-center py-4 border border-dashed border-white/20 rounded-3xl">No media to manage.</Text>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {photos.map((photo) => (
                  <View key={photo.id} className="w-[48%] aspect-[3/4] mb-4 bg-[#111] rounded-2xl overflow-hidden relative">
                    <Image
                      source={{ uri: photo.storage_path.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.6)', 'transparent']}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60 }}
                    />
                    <Pressable
                      onPress={() => deletePhoto(photo)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 items-center justify-center backdrop-blur-md active:scale-95"
                    >
                      <Trash2 size={14} color="#fff" />
                    </Pressable>
                    <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-full">
                      <Text className="text-white text-[10px] font-mono">{photo.guest_name}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Danger Zone */}
          <View className="mt-8 border border-red-500/20 bg-red-500/5 rounded-[2rem] p-6">
            <Text className="font-serif text-xl text-red-400 mb-2">Danger Zone</Text>
            <Text className="text-white/50 font-sans text-xs mb-6">
              Deleting this roll will permanently remove all photos. This action cannot be undone.
            </Text>
            <Pressable onPress={deleteEvent} className="bg-red-500/20 py-4 rounded-full items-center border border-red-500/30 active:bg-red-500/40">
              <Text className="font-mono text-red-400 uppercase tracking-widest font-bold text-xs">Delete Roll</Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
