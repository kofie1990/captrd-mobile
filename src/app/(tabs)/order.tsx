import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Book, CheckCircle, ChevronLeft, ChevronRight, Image as ImageIcon, LayoutGrid } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LoadingState } from '@/components/ui/LoadingState';

const { width } = Dimensions.get('window');

type Event = {
  id: string;
  title: string;
  cover_photo_url?: string;
  aesthetic_filter: string;
};

type Photo = {
  id: string;
  storage_path: string;
  guest_name: string;
  created_at: string;
};

export default function OrderScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);

  // Customization state
  const [format, setFormat] = useState<"photobook" | "polaroids">("photobook");
  const [finish, setFinish] = useState<"matte" | "glossy">("matte");
  const [title, setTitle] = useState("");
  const [currentBookPage, setCurrentBookPage] = useState(0);

  // Shipping state
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingZip, setShippingZip] = useState("");

  // Checkout state
  const [showShippingStep, setShowShippingStep] = useState(false);
  const [simulatingCheckout, setSimulatingCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, cover_photo_url, aesthetic_filter")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, [user]);

  const handleSelectEvent = async (event: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedEvent(event);
    setTitle(event.title);
    setCurrentBookPage(0);
    setFetchingPhotos(true);
    const { data } = await supabase
      .from("photos")
      .select("id, storage_path, guest_name, created_at")
      .eq("event_id", event.id)
      .limit(10);

    if (data) setPhotos(data);
    setFetchingPhotos(false);
  };

  const handlePlaceOrder = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSimulatingCheckout(true);
    setTimeout(() => {
      setSimulatingCheckout(false);
      setOrderComplete(true);
    }, 2000);
  };

  const resolveLocalUrl = (url: string | undefined) => {
    if (!url) return '';
    return Platform.OS === 'android' ? url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : url;
  };

  if (loading) {
    return <LoadingState.Screen />;
  }

  if (orderComplete) {
    return (
      <View className="flex-1 bg-[#09090b] items-center justify-center p-6">
        <StatusBar style="light" />
        <View className="glass p-12 rounded-[3rem] border border-white/10 items-center w-full max-w-sm">
          <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-6">
            <CheckCircle size={40} color="#22c55e" />
          </View>
          <Text className="font-serif text-4xl text-white mb-4 text-center">Order Placed!</Text>
          <Text className="text-white/60 mb-8 font-mono text-xs leading-relaxed text-center">
            Your {format === "photobook" ? "photobook" : "print set"} for "{selectedEvent?.title}" is being prepared. You will receive an email confirmation shortly.
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/');
            }}
            className="bg-white px-8 py-4 rounded-full w-full active:scale-95 transition-transform"
          >
            <Text className="text-black font-mono font-bold uppercase tracking-widest text-xs text-center">
              Back to Dashboard
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#09090b' }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingTop: 60 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 mb-6">
          {selectedEvent && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (showShippingStep) setShowShippingStep(false);
                else if (selectedEvent) setSelectedEvent(null);
              }}
              className="flex-row items-center gap-2 mb-8 opacity-60 active:opacity-100"
            >
              <ArrowLeft size={16} color="#fff" />
              <Text className="text-white font-mono text-xs uppercase tracking-widest">
                {showShippingStep ? "Back to Customization" : "Change Roll"}
              </Text>
            </Pressable>
          )}

          {!selectedEvent ? (
            // Step 1: Select Roll
            <View>
              <Text className="font-serif text-4xl text-white mb-2">Order Prints</Text>
              <Text className="text-white/60 mb-8">Select a film roll to begin creating your custom physical prints or photobook.</Text>

              {events.length === 0 ? (
                <View className="py-16 items-center border border-dashed border-white/20 rounded-3xl">
                  <Text className="text-white/50 italic font-serif text-xl">No rolls found.</Text>
                </View>
              ) : (
                <View className="gap-4">
                  {events.map(ev => (
                    <Pressable
                      key={ev.id}
                      onPress={() => handleSelectEvent(ev)}
                      className="aspect-[2/1] rounded-[24px] overflow-hidden bg-black justify-end p-5 active:scale-[0.98]"
                    >
                      <Image
                        source={{ uri: resolveLocalUrl(ev.cover_photo_url || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop") }}
                        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.6 }}
                        contentFit="cover"
                        transition={500}
                      />
                      <View className="absolute inset-0 bg-black/40" />
                      <View className="relative z-10 flex-row justify-between items-end">
                        <Text className="font-serif text-2xl text-white max-w-[75%]">{ev.title}</Text>
                        <View className="bg-white/20 px-3 py-1 rounded-full border border-white/20">
                          <Text className="font-mono text-[9px] uppercase tracking-widest text-white">Select</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ) : showShippingStep ? (
            // Step 3: Shipping Details
            <View className="items-center py-4">
              <View className="w-full bg-white/5 p-6 rounded-[2rem] border border-white/10">
                <View className="mb-6">
                  <Text className="font-serif text-3xl text-white mb-2">Shipping</Text>
                  <Text className="text-white/60 text-sm">Where should we send your {format === "photobook" ? "photobook" : "prints"}?</Text>
                </View>

                <View className="gap-4 mb-6">
                  <TextInput
                    placeholder="Full Name"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={shippingName}
                    onChangeText={setShippingName}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-white font-sans text-base"
                  />
                  <TextInput
                    placeholder="Address"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={shippingAddress}
                    onChangeText={setShippingAddress}
                    className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-white font-sans text-base"
                  />
                  <View className="flex-row gap-3">
                    <TextInput
                      placeholder="City"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={shippingCity}
                      onChangeText={setShippingCity}
                      className="flex-1 bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-white font-sans text-base"
                    />
                    <TextInput
                      placeholder="ZIP"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      value={shippingZip}
                      onChangeText={setShippingZip}
                      className="w-[100px] bg-[#111] border border-white/10 rounded-xl px-4 py-4 text-white font-sans text-base"
                    />
                  </View>
                </View>

                <View className="border-t border-white/10 pt-6">
                  <View className="flex-row justify-between items-end mb-6">
                    <View>
                      <Text className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-1">Total</Text>
                      <Text className="font-serif text-3xl text-white">$34.99</Text>
                    </View>
                    <Text className="text-sm text-white/60">Free shipping</Text>
                  </View>

                  <Pressable
                    onPress={handlePlaceOrder}
                    disabled={simulatingCheckout || !shippingName || !shippingAddress || !shippingCity || !shippingZip}
                    className={`w-full py-4 rounded-full flex-row justify-center items-center ${(simulatingCheckout || !shippingName || !shippingAddress || !shippingCity || !shippingZip) ? 'bg-white/40' : 'bg-white active:scale-95'}`}
                  >
                    {simulatingCheckout && <LoadingState.Spinner size={16} style={{ marginRight: 8 }} />}
                    <Text className="text-black font-mono font-bold uppercase tracking-widest text-xs">
                      {simulatingCheckout ? "Processing..." : "Place Order"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            // Step 2: Customize & Preview
            <View>
              <View className="mb-6">
                <Text className="font-serif text-4xl text-white mb-2">Customize</Text>
                <Text className="text-white/60 text-sm">Configure your print options for "{selectedEvent.title}"</Text>
              </View>

              {/* Format Selection */}
              <View className="mb-6">
                <Text className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-3">Format</Text>
                <View className="flex-row gap-4">
                  <Pressable
                    onPress={() => setFormat("photobook")}
                    className={`flex-1 p-4 rounded-2xl border flex-col items-center justify-center gap-3 ${format === "photobook" ? "bg-white border-white" : "bg-white/5 border-white/10"}`}
                  >
                    <Book size={24} color={format === "photobook" ? "#000" : "#fff"} />
                    <Text className={`font-medium text-xs ${format === "photobook" ? "text-black" : "text-white"}`}>Photobook</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFormat("polaroids")}
                    className={`flex-1 p-4 rounded-2xl border flex-col items-center justify-center gap-3 ${format === "polaroids" ? "bg-white border-white" : "bg-white/5 border-white/10"}`}
                  >
                    <LayoutGrid size={24} color={format === "polaroids" ? "#000" : "#fff"} />
                    <Text className={`font-medium text-xs ${format === "polaroids" ? "text-black" : "text-white"}`}>Classic Prints</Text>
                  </Pressable>
                </View>
              </View>

              {/* Paper Finish */}
              <View className="mb-8">
                <Text className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-3">Paper Finish</Text>
                <View className="flex-row bg-white/5 rounded-xl p-1">
                  <Pressable
                    onPress={() => setFinish("matte")}
                    className={`flex-1 py-3 rounded-lg items-center ${finish === "matte" ? "bg-white/20" : ""}`}
                  >
                    <Text className={`font-mono text-[10px] uppercase tracking-widest ${finish === "matte" ? "text-white font-bold" : "text-white/60"}`}>Matte</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setFinish("glossy")}
                    className={`flex-1 py-3 rounded-lg items-center ${finish === "glossy" ? "bg-white/20" : ""}`}
                  >
                    <Text className={`font-mono text-[10px] uppercase tracking-widest ${finish === "glossy" ? "text-white font-bold" : "text-white/60"}`}>Glossy</Text>
                  </Pressable>
                </View>
              </View>

              {/* Preview */}
              <View className="mb-8">
                <Text className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-3">Preview</Text>
                <View className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden items-center justify-center p-6" style={{ minHeight: 380 }}>
                  {fetchingPhotos ? (
                    <View className="items-center justify-center" style={{ height: 300 }}>
                      <LoadingState.Spinner size={32} />
                      <Text className="font-mono text-xs uppercase tracking-widest text-white/60 mt-4">Loading preview...</Text>
                    </View>
                  ) : format === "photobook" ? (
                    // Photobook Preview
                    <View className="items-center" style={{ gap: 16 }}>
                      <View
                        style={{
                          width: width * 0.6,
                          aspectRatio: 3 / 4,
                          backgroundColor: '#f8f8f8',
                          borderTopRightRadius: 12,
                          borderBottomRightRadius: 12,
                          borderTopLeftRadius: 4,
                          borderBottomLeftRadius: 4,
                          shadowColor: '#000',
                          shadowOffset: { width: 15, height: 15 },
                          shadowOpacity: 0.6,
                          shadowRadius: 30,
                          elevation: 20,
                          transform: [{ perspective: 1200 }, { rotateY: '-8deg' }, { rotateX: '3deg' }],
                          overflow: 'hidden',
                        }}
                      >
                        {/* Spine shadow */}
                        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, backgroundColor: 'rgba(0,0,0,0.15)', zIndex: 10, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }} />

                        <View style={{ flex: 1, padding: 16 }}>
                          {currentBookPage === 0 ? (
                            // Cover
                            <View style={{ flex: 1 }}>
                              <View style={{ flex: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e0e0e0' }}>
                                <Image
                                  source={{ uri: resolveLocalUrl(selectedEvent.cover_photo_url || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop") }}
                                  style={{ width: '100%', height: '100%' }}
                                  contentFit="cover"
                                />
                              </View>
                              <View style={{ marginTop: 20, alignItems: 'center' }}>
                                <Text style={{ fontFamily: 'serif', fontSize: 20, color: '#111', textAlign: 'center' }}>{title || "Untitled Roll"}</Text>
                                <Text style={{ fontFamily: 'monospace', fontSize: 7, color: '#999', marginTop: 6, letterSpacing: 2, textTransform: 'uppercase' }}>Captrd Print Studio</Text>
                              </View>
                            </View>
                          ) : (
                            // Inner Page
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                              {photos[currentBookPage - 1] ? (
                                <View style={{ width: '85%', alignItems: 'center' }}>
                                  <View style={{ width: '100%', aspectRatio: 1, overflow: 'hidden' }}>
                                    <Image
                                      source={{ uri: resolveLocalUrl(photos[currentBookPage - 1].storage_path) }}
                                      style={{ width: '100%', height: '100%' }}
                                      contentFit="contain"
                                    />
                                  </View>
                                  <View style={{ width: '70%', marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <Text style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 11, color: '#333' }}>{photos[currentBookPage - 1].guest_name}</Text>
                                    <Text style={{ fontFamily: 'monospace', fontSize: 7, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>
                                      {new Date(photos[currentBookPage - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                  </View>
                                </View>
                              ) : null}
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Page Controls */}
                      {photos.length > 0 && (
                        <View className="flex-row items-center bg-[#09090b] rounded-full px-5 py-2 border border-white/10" style={{ gap: 16 }}>
                          <Pressable
                            onPress={() => setCurrentBookPage(Math.max(0, currentBookPage - 1))}
                            disabled={currentBookPage === 0}
                            style={{ opacity: currentBookPage === 0 ? 0.3 : 1 }}
                          >
                            <ChevronLeft size={20} color="#fff" />
                          </Pressable>
                          <Text className="font-mono text-[10px] uppercase tracking-widest text-white/60" style={{ width: 80, textAlign: 'center' }}>
                            Page {currentBookPage} / {photos.length}
                          </Text>
                          <Pressable
                            onPress={() => setCurrentBookPage(Math.min(photos.length, currentBookPage + 1))}
                            disabled={currentBookPage === photos.length}
                            style={{ opacity: currentBookPage === photos.length ? 0.3 : 1 }}
                          >
                            <ChevronRight size={20} color="#fff" />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  ) : (
                    // Polaroids / Classic Prints Preview
                    <View style={{ width: '100%', height: 300, alignItems: 'center', justifyContent: 'center' }}>
                      {photos.length > 0 ? photos.slice(0, 4).map((photo, i) => {
                        const rotations = [-12, 8, -4, 15];
                        const xOffsets = [-25, -5, 15, 35];
                        const yOffsets = [-12, 0, 12, -4];
                        return (
                          <View
                            key={photo.id}
                            style={{
                              position: 'absolute',
                              width: 140,
                              aspectRatio: 3 / 4,
                              backgroundColor: '#fcfcfc',
                              padding: 8,
                              paddingBottom: 28,
                              transform: [
                                { rotate: `${rotations[i]}deg` },
                                { translateX: xOffsets[i] },
                                { translateY: yOffsets[i] },
                              ],
                              zIndex: 10 - i,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 10 },
                              shadowOpacity: 0.5,
                              shadowRadius: 20,
                              elevation: 10 - i,
                              borderWidth: 0.5,
                              borderColor: 'rgba(0,0,0,0.05)',
                            }}
                          >
                            <View style={{ flex: 1, backgroundColor: '#111', overflow: 'hidden' }}>
                              <Image
                                source={{ uri: resolveLocalUrl(photo.storage_path) }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                              />
                            </View>
                            <View style={{ marginTop: 4, alignItems: 'center' }}>
                              <Text style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 9, color: '#222' }}>{photo.guest_name}</Text>
                              <Text style={{ fontFamily: 'monospace', fontSize: 5, color: '#777', textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 }}>
                                {new Date(photo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                          </View>
                        );
                      }) : (
                        <View style={{ width: 120, aspectRatio: 3 / 4, backgroundColor: '#fcfcfc', padding: 8, paddingBottom: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 8 }}>
                          <ImageIcon size={24} color="rgba(0,0,0,0.2)" />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowShippingStep(true);
                }}
                className="w-full bg-white py-4 rounded-full active:scale-95 transition-transform"
              >
                <Text className="text-black text-center font-mono font-bold uppercase tracking-widest text-xs">
                  Continue to Shipping
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
