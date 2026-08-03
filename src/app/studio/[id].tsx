import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LoadingState } from '@/components/ui/LoadingState';
import { ArrowLeft, Copy, ExternalLink, Trash2, Image as ImageIcon, Star, Upload } from 'lucide-react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLocalSearchParams, router } from 'expo-router';
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

type StudioEvent = {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  studio_id: string;
};

type Studio = {
  slug: string;
  business_name: string;
};

type Photo = {
  id: string;
  public_url: string;
  created_at: string;
};

export default function EventDashboardScreen() {
  const { id } = useLocalSearchParams();
  const eventId = id as string;
  const { session } = useAuth();
  
  const [event, setEvent] = useState<StudioEvent | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchEventData();
  }, [eventId, session]);

  const fetchEventData = async () => {
    if (!session || !eventId) return;
    try {
      const { data: eventData, error: eventError } = await supabase
        .from("studio_events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError || !eventData) {
        Alert.alert("Error", "Event not found");
        router.back();
        return;
      }

      setEvent(eventData);

      const { data: studioData } = await supabase
        .from("studios")
        .select("slug, business_name")
        .eq("id", eventData.studio_id)
        .single();
        
      if (studioData) setStudio(studioData);

      const { data: photosData } = await supabase
        .from("studio_photos")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (photosData) setPhotos(photosData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEventData();
  };

  const handleUploadPhotos = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to grant permission to access your photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      base64: true,
      quality: 1, // Keep original quality
    });

    if (!result.canceled && result.assets.length > 0) {
      setUploading(true);
      setUploadProgress(0);
      let successCount = 0;

      for (const asset of result.assets) {
        if (!asset.base64) continue;
        
        try {
          const fileExt = asset.uri.split('.').pop() || 'jpg';
          const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
          const filePath = `${eventId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("studio_uploads")
            .upload(filePath, decode(asset.base64), {
              contentType: `image/${fileExt}`,
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("studio_uploads")
            .getPublicUrl(filePath);

          await supabase
            .from("studio_photos")
            .insert({
              event_id: eventId,
              storage_path: filePath,
              public_url: publicUrl,
            });

          successCount++;
          setUploadProgress(Math.round((successCount / result.assets.length) * 100));
        } catch (error) {
          console.error("Upload error for an image:", error);
        }
      }

      setUploading(false);
      fetchEventData(); // Refresh list after upload
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Optimistic UI update
            setPhotos(photos.filter(p => p.id !== photoId));
            const { error } = await supabase.from("studio_photos").delete().eq("id", photoId);
            if (error) {
              Alert.alert("Error", "Failed to delete photo");
              fetchEventData(); // Revert if failed
            }
          }
        }
      ]
    );
  };

  const handleSetCover = async (photoUrl: string) => {
    if (!event) return;
    
    // Optimistic UI update
    setEvent({ ...event, cover_image_url: photoUrl });
    
    const { error } = await supabase
      .from("studio_events")
      .update({ cover_image_url: photoUrl })
      .eq("id", event.id);
      
    if (error) {
      Alert.alert("Error", "Failed to set cover image.");
      fetchEventData(); // Revert if failed
    }
  };

  const getShareUrl = () => {
    if (studio && event) {
      return `https://captrd.live/g/${studio.slug}/${event.slug}`;
    }
    return "";
  };

  if (loading) {
    return <LoadingState.Screen />;
  }

  if (!event || !studio) return null;

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="px-6 pt-20 pb-4">
        <Pressable onPress={() => router.back()} className="flex-row items-center gap-2 mb-6">
          <ArrowLeft size={20} color="rgba(255,255,255,0.5)" />
          <Text className="text-white/50 font-mono text-xs uppercase tracking-widest">Back to Dashboard</Text>
        </Pressable>

        <View className="bg-white/5 p-6 rounded-[2rem] border border-white/10 relative overflow-hidden">
          <Text className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-50 text-white mb-2">Event Gallery</Text>
          <Text className="font-serif text-3xl tracking-tight text-white mb-1" numberOfLines={1}>
            {event.name}
          </Text>
          <Text className="text-white/60 font-sans text-sm mb-6">{photos.length} photos uploaded</Text>
          
          <Pressable 
            onPress={() => Linking.openURL(getShareUrl())}
            className="flex-row items-center justify-center gap-2 border border-white/20 py-4 rounded-xl active:bg-white/5 mb-3"
          >
            <ExternalLink size={16} color="#fff" />
            <Text className="text-white font-mono text-xs uppercase tracking-widest">View Public Gallery</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <Text className="font-serif text-2xl text-white">Gallery</Text>
          <Pressable 
            onPress={handleUploadPhotos}
            disabled={uploading}
            className={`bg-white px-5 py-2.5 rounded-full flex-row items-center gap-2 active:scale-95 transition-transform ${uploading ? 'opacity-50' : ''}`}
          >
            <Upload size={16} color="#000" />
            <Text className="text-black font-mono text-xs uppercase tracking-widest font-bold">
              {uploading ? `Uploading ${uploadProgress}%` : "Upload"}
            </Text>
          </Pressable>
        </View>
        
        {photos.length === 0 ? (
          <View className="py-20 items-center border border-dashed border-white/10 rounded-[2rem]">
            <ImageIcon size={32} color="rgba(255,255,255,0.2)" />
            <Text className="text-white/50 font-sans mt-4">No photos uploaded yet.</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {photos.map(photo => (
              <View key={photo.id} className="relative w-[48%] aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-4">
                <Image 
                  source={{ 
                    uri: Platform.OS === 'android' ? photo.public_url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : photo.public_url 
                  }} 
                  style={{ width: '100%', height: '100%', position: 'absolute' }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                
                <View className="absolute inset-0 bg-black/20 p-2 justify-between">
                  <Pressable
                    onPress={() => handleSetCover(photo.public_url)}
                    className={`self-end p-2 rounded-full ${event.cover_image_url === photo.public_url ? 'bg-white' : 'bg-black/50'}`}
                  >
                    <Star size={14} color={event.cover_image_url === photo.public_url ? "#000" : "#fff"} fill={event.cover_image_url === photo.public_url ? "#000" : "transparent"} />
                  </Pressable>
                  
                  <View className="flex-row justify-between w-full">
                    <Pressable onPress={() => Linking.openURL(photo.public_url)} className="p-2 bg-black/50 rounded-full">
                      <ExternalLink size={14} color="#fff" />
                    </Pressable>
                    <Pressable onPress={() => handleDeletePhoto(photo.id)} className="p-2 bg-red-500/80 rounded-full">
                      <Trash2 size={14} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
