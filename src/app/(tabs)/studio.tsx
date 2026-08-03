import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, Modal, RefreshControl, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Plus, Settings, Image as ImageIcon, ExternalLink, MoreVertical, X, Edit2, Trash2, Eye } from 'lucide-react-native';
import { Image } from 'expo-image';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { LoadingState } from '@/components/ui/LoadingState';

type Studio = {
  id: string;
  business_name: string;
  slug: string;
};

type StudioEvent = {
  id: string;
  name: string;
  slug: string;
  cover_image_url: string | null;
  created_at: string;
  photo_count?: number;
};

export default function StudioScreen() {
  const { session } = useAuth();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [events, setEvents] = useState<StudioEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Create Studio State
  const [creatingStudio, setCreatingStudio] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  
  // Actions State
  const [eventName, setEventName] = useState("");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<StudioEvent | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    if (!session) return;
    try {
      const { data: studioData, error: studioError } = await supabase
        .from("studios")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (studioError || !studioData) {
        setLoading(false);
        return;
      }

      setStudio(studioData);

      const { data: eventsData, error: eventsError } = await supabase
        .from("studio_events")
        .select("*, studio_photos(count)")
        .eq("studio_id", studioData.id)
        .order("created_at", { ascending: false });

      if (eventsData) {
        const mappedEvents = eventsData.map((e: any) => ({
          ...e,
          photo_count: e.studio_photos[0]?.count || 0
        }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error("Error fetching studio data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreateStudio = async () => {
    if (!businessName.trim() || !slug.trim() || !session) return;
    setCreatingStudio(true);

    try {
      const { data, error } = await supabase
        .from("studios")
        .insert({
          user_id: session.user.id,
          business_name: businessName.trim(),
          slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setStudio(data);
        fetchData();
      }
    } catch (error) {
      console.error("Error creating studio:", error);
      Alert.alert("Error", "Failed to create studio. The slug might be taken.");
    } finally {
      setCreatingStudio(false);
    }
  };

  const submitCreateEvent = async () => {
    if (!studio || !eventName.trim()) return;
    setCreatingEvent(true);
    
    const eventSlug = eventName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);

    const { data, error } = await supabase
      .from("studio_events")
      .insert({
        studio_id: studio.id,
        name: eventName.trim(),
        slug: eventSlug
      })
      .select()
      .single();

    setCreatingEvent(false);
    if (error) {
      console.error("Error creating event:", error);
      Alert.alert("Error", "Failed to create gallery");
    } else if (data) {
      setShowCreateModal(false);
      setEventName('');
      fetchData();
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      "Delete Gallery",
      "Are you sure you want to delete this gallery and all of its photos? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            setShowOptionsModal(false);
            try {
              const { error } = await supabase
                .from("studio_events")
                .delete()
                .eq("id", eventId);

              if (error) throw error;
              setEvents(events.filter(e => e.id !== eventId));
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to delete gallery");
            }
          }
        }
      ]
    );
  };

  const submitRenameEvent = async () => {
    if (!selectedEvent || !renameName.trim()) return;
    setRenaming(true);

    try {
      const { data, error } = await supabase
        .from("studio_events")
        .update({ name: renameName.trim() })
        .eq("id", selectedEvent.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setEvents(events.map(e => e.id === selectedEvent.id ? { ...e, name: data.name } : e));
        setShowRenameModal(false);
      }
    } catch (error) {
      console.error("Error renaming event:", error);
      Alert.alert("Error", "Failed to rename gallery");
    } finally {
      setRenaming(false);
    }
  };

  const openEventOptions = (event: StudioEvent) => {
    setSelectedEvent(event);
    setShowOptionsModal(true);
  };

  if (loading) {
    return <LoadingState.Screen />;
  }

  if (!studio) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <StatusBar style="light" />
        <View className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-[2rem]">
          <Text className="font-serif text-4xl mb-2 text-center text-white">Setup Studio</Text>
          <Text className="text-white/60 text-center mb-8 text-sm">
            Create your photographer profile to start uploading high-resolution galleries.
          </Text>
          
          <View className="gap-4">
            <View>
              <Text className="text-[10px] uppercase tracking-widest font-mono text-white/50 ml-2 mb-2">Business Name</Text>
              <TextInput 
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. John Doe Photography"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white font-sans"
              />
            </View>
            <View>
              <Text className="text-[10px] uppercase tracking-widest font-mono text-white/50 ml-2 mb-2">Custom URL Slug</Text>
              <View className="flex-row items-center bg-white/5 border border-white/20 rounded-xl overflow-hidden px-4">
                <Text className="text-white/40 font-mono text-sm">captrd.live/g/</Text>
                <TextInput 
                  value={slug}
                  onChangeText={setSlug}
                  placeholder="johndoe"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  autoCapitalize="none"
                  className="flex-1 py-4 text-white font-sans"
                />
              </View>
            </View>
            <Pressable 
              onPress={handleCreateStudio}
              disabled={creatingStudio}
              className={`mt-4 w-full bg-white py-4 rounded-full active:scale-[0.98] transition-transform ${creatingStudio ? 'opacity-50' : ''}`}
            >
              <Text className="text-black text-center font-mono text-xs uppercase tracking-widest font-bold">
                {creatingStudio ? "Creating..." : "Create Studio"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="px-6 pt-20 pb-6 flex-row justify-between items-end">
        <View className="flex-1">
          <Text className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">Studio Dashboard</Text>
          <Text className="font-serif text-4xl tracking-tight text-white mb-2" numberOfLines={1}>
            {studio.business_name}
          </Text>
          <View className="self-start px-3 py-1 bg-white/10 rounded-full">
            <Text className="text-[10px] font-mono text-white/70">
              captrd.live/g/{studio.slug}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center gap-3 ml-4">
          <Pressable 
            onPress={() => setShowCreateModal(true)}
            className="w-12 h-12 bg-white rounded-full items-center justify-center active:scale-[0.96] transition-transform"
          >
            <Plus size={24} color="#000" />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {events.length === 0 ? (
          <View className="w-full py-24 border border-dashed border-white/20 rounded-[2rem] items-center justify-center mt-4">
            <View className="w-16 h-16 rounded-full bg-white/5 items-center justify-center mb-6">
              <ImageIcon size={24} color="rgba(255,255,255,0.4)" />
            </View>
            <Text className="font-serif text-2xl mb-2 text-white">No galleries yet</Text>
            <Text className="text-white/50 text-center max-w-[250px] mb-8 font-sans">
              Create your first event gallery and start uploading high-resolution photos.
            </Text>
            <Pressable 
              onPress={() => setShowCreateModal(true)}
              className="px-8 py-3 border border-white/20 rounded-full active:bg-white/10"
            >
              <Text className="text-white font-mono text-xs uppercase tracking-widest">
                Create Gallery
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-6 mt-2">
            {events.map((event) => (
              <Pressable 
                key={event.id}
                onPress={() => router.push(`/studio/${event.id}`)}
                className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden"
              >
                <View className="aspect-[4/3] bg-white/10 relative">
                  {event.cover_image_url ? (
                    <Image 
                      source={{ 
                        uri: Platform.OS === 'android' ? event.cover_image_url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : event.cover_image_url 
                      }} 
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      contentFit="cover" 
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <ImageIcon size={32} color="rgba(255,255,255,0.2)" />
                    </View>
                  )}
                </View>
                
                <View className="p-5 flex-row justify-between items-center">
                  <View className="flex-1 pr-4">
                    <Text className="font-serif text-2xl text-white mb-1" numberOfLines={1}>{event.name}</Text>
                    <Text className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                      {new Date(event.created_at).toLocaleDateString()} • {event.photo_count} Photos
                    </Text>
                  </View>
                  <Pressable 
                    onPress={() => openEventOptions(event)}
                    className="p-2 -mr-2 rounded-full active:bg-white/10"
                  >
                    <MoreVertical size={20} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Options Modal */}
      <Modal visible={showOptionsModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowOptionsModal(false)}>
          <View className="bg-[#111] rounded-t-[2rem] p-6 pb-12 border-t border-white/10" onStartShouldSetResponder={() => true}>
            <View className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
            <Text className="font-serif text-2xl text-white mb-6 text-center">{selectedEvent?.name}</Text>
            
            <View className="gap-2">
              <Pressable 
                onPress={() => {
                  if (selectedEvent) Linking.openURL(`https://captrd.live/g/${studio.slug}/${selectedEvent.slug}`);
                  setShowOptionsModal(false);
                }}
                className="flex-row items-center gap-4 p-4 rounded-xl active:bg-white/5"
              >
                <ExternalLink size={20} color="#fff" />
                <Text className="text-white font-sans text-base">Open Live Gallery</Text>
              </Pressable>

              <Pressable 
                onPress={() => {
                  setRenameName(selectedEvent?.name || "");
                  setShowOptionsModal(false);
                  setTimeout(() => setShowRenameModal(true), 300);
                }}
                className="flex-row items-center gap-4 p-4 rounded-xl active:bg-white/5"
              >
                <Edit2 size={20} color="#fff" />
                <Text className="text-white font-sans text-base">Rename</Text>
              </Pressable>

              <Pressable 
                onPress={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
                className="flex-row items-center gap-4 p-4 rounded-xl active:bg-red-500/10"
              >
                <Trash2 size={20} color="#ef4444" />
                <Text className="text-red-500 font-sans text-base">Delete Gallery</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View className="bg-[#111] rounded-[2rem] p-6 border border-white/10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-serif text-3xl text-white">New Gallery</Text>
              <Pressable onPress={() => setShowCreateModal(false)} className="p-2 -mr-2 opacity-50 active:opacity-100">
                <X size={24} color="#fff" />
              </Pressable>
            </View>
            
            <Text className="text-white/60 text-sm mb-4">Enter a name for the event gallery.</Text>
            
            <TextInput
              autoFocus
              value={eventName}
              onChangeText={setEventName}
              placeholder="e.g., Smith Wedding 2026"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white font-sans mb-4"
            />
            
            <Pressable 
              onPress={submitCreateEvent}
              disabled={creatingEvent || !eventName.trim()}
              className={`w-full bg-white py-4 rounded-full active:scale-[0.98] transition-transform ${(creatingEvent || !eventName.trim()) ? 'opacity-50' : ''}`}
            >
              <Text className="text-black text-center font-mono text-xs uppercase tracking-widest font-bold">
                {creatingEvent ? "Creating..." : "Create Gallery"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center px-6">
          <View className="bg-[#111] rounded-[2rem] p-6 border border-white/10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-serif text-3xl text-white">Rename Gallery</Text>
              <Pressable onPress={() => setShowRenameModal(false)} className="p-2 -mr-2 opacity-50 active:opacity-100">
                <X size={24} color="#fff" />
              </Pressable>
            </View>
            
            <Text className="text-white/60 text-sm mb-4">Enter a new name for the event gallery.</Text>
            
            <TextInput
              autoFocus
              value={renameName}
              onChangeText={setRenameName}
              placeholder="e.g., Smith Wedding 2026"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-4 text-white font-sans mb-4"
            />
            
            <Pressable 
              onPress={submitRenameEvent}
              disabled={renaming || !renameName.trim()}
              className={`w-full bg-white py-4 rounded-full active:scale-[0.98] transition-transform ${(renaming || !renameName.trim()) ? 'opacity-50' : ''}`}
            >
              <Text className="text-black text-center font-mono text-xs uppercase tracking-widest font-bold">
                {renaming ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
