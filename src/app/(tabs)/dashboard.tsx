import { RollCard } from '@/components/RollCard';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, Image as ImageIcon, Plus, QrCode, X, RefreshCcw } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { ActivityIndicator, Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, RefreshControl } from 'react-native';
import { InviteCaptureView } from '@/components/InviteCaptureView';
import { LoadingState } from '@/components/ui/LoadingState';
import * as Sharing from 'expo-sharing';
import { useRef } from 'react';

const { width } = Dimensions.get('window');

type Event = {
  id: string;
  title: string;
  reveal_at: string;
  aesthetic_filter: string;
  short_code: string;
  max_photos_per_user: number;
  cover_photo_url?: string;
  invite_details?: string;
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Photographer';

  const [events, setEvents] = useState<Event[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [shortCode, setShortCode] = useState('');

  const [shareItem, setShareItem] = useState<Event | null>(null);
  const viewShotRef = useRef<any>(null);

  const handleShareInvite = async (item: Event) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShareItem(item);
    // Give it a brief moment to render with the new item data
    setTimeout(async () => {
      if (viewShotRef.current) {
        try {
          const uri = await viewShotRef.current.capture();
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
              dialogTitle: 'Share your event invite',
              mimeType: 'image/jpeg',
            });
          }
        } catch (error) {
          console.error("Failed to capture and share invite:", error);
        }
      }
      setShareItem(null);
    }, 300);
  };

  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!user) return;

    // Fetch created events
    const { data: createdData } = await supabase
      .from('events')
      .select('*')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false });

    if (createdData) {
      setEvents(createdData);
      const eventIds = createdData.map(e => e.id);
      if (eventIds.length > 0) {
        const { count } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .in('event_id', eventIds);
        if (count) setTotalPhotos(count);
      } else {
        setTotalPhotos(0);
      }
    }

    // Fetch joined events
    const { data: joinedData } = await supabase
      .from('event_participants')
      .select('events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (joinedData) {
      const mapped = joinedData.map((d: any) => d.events).filter(Boolean);
      setJoinedEvents(mapped);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchEvents();
    setRefreshing(false);
  };

  const handleCreateRoll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create');
  };

  const resolveLocalUrl = (url: string | undefined) => {
    if (!url) return '';
    return Platform.OS === 'android' ? url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : url;
  };

  if (loading) {
    return <LoadingState.Screen />;
  }

  const currentList = activeTab === 'created' ? events : joinedEvents;

  const ListHeader = () => (
    <View>
      {/* Welcome Section */}
      <View className="px-6 pb-6 mt-4 flex-row justify-between items-center">
        <View>
          <Text className="font-serif text-3xl tracking-tight text-white mb-1">
            Welcome back,
          </Text>
          <Text className="font-serif text-3xl tracking-tight text-white/70 italic">
            {userName}
          </Text>
        </View>
        <Pressable 
          onPress={onRefresh}
          className="w-12 h-12 rounded-full bg-white/10 items-center justify-center active:scale-95"
        >
          <RefreshCcw size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Metrics & Actions Grid */}
      <View className="px-6 flex-row gap-4 mb-6">
        <View className="flex-1 glass p-5 rounded-3xl overflow-hidden border border-white/10 relative justify-center">
          <View className="absolute -top-4 -right-4 opacity-5">
            <ImageIcon size={80} color="#fff" />
          </View>
          <Text className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Moments</Text>
          <Text className="font-serif text-4xl text-white">{totalPhotos}</Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsJoinModalVisible(true);
          }}
          className="flex-1 bg-white p-5 rounded-3xl overflow-hidden relative justify-center active:scale-95 transition-transform shadow-lg"
        >
          <View className="absolute -top-4 -right-4 opacity-[0.7]">
            <QrCode size={80} color="#000" />
          </View>
          <Text className="font-mono text-[10px] uppercase tracking-widest text-black/60 mb-2">Guest Access</Text>
          <Text className="font-serif text-2xl text-black">Join Roll</Text>
        </Pressable>
      </View>

      {/* Create New Roll CTA */}
      <View className="px-6 mb-8">
        <Pressable
          onPress={handleCreateRoll}
          className="w-full glass-panel p-5 rounded-3xl flex-row items-center justify-between active:scale-[0.98] transition-transform"
        >
          <View>
            <Text className="font-serif text-xl text-white mb-1">Captr every memory</Text>
            <Text className="text-white/60 text-xs font-sans">Create a new roll to start collecting.</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-white items-center justify-center">
            <Plus size={20} color="#000" />
          </View>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="px-6 flex-row gap-6 mb-4">
        <Pressable onPress={() => setActiveTab('created')}>
          <Text className={`font-serif text-2xl transition-opacity ${activeTab === 'created' ? 'text-white' : 'text-white/40'}`}>
            Your Rolls
          </Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('joined')}>
          <Text className={`font-serif text-2xl transition-opacity ${activeTab === 'joined' ? 'text-white' : 'text-white/40'}`}>
            Joined
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <StatusBar style="light" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 60 }} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        <ListHeader />
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={Math.min(width * 0.75, 300) + 20}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-10 px-6 border border-white/10 rounded-[24px] bg-white/5" style={{ width: Math.min(width * 0.75, 300) }}>
              <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center mb-4">
                <ImageIcon size={24} color="#fff" opacity={0.6} />
              </View>
              <Text className="font-serif text-xl text-white mb-2 text-center">
                {activeTab === 'created' ? 'No rolls yet' : "You haven't joined any rolls"}
              </Text>
              <Text className="text-white/60 text-sm font-sans text-center px-4 mb-5">
                {activeTab === 'created'
                  ? 'Start capturing moments with your guests.'
                  : 'Join a roll as a guest to see it here.'}
              </Text>
              {activeTab === 'created' && (
                <Pressable
                  onPress={handleCreateRoll}
                  className="w-full bg-white py-4 rounded-full flex-row items-center justify-center gap-2 active:scale-95"
                >
                  <Plus size={16} color="#000" />
                  <Text className="font-mono text-xs uppercase tracking-widest font-bold text-black">
                    Create Your First Roll
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          renderItem={({ item }) => (
            <View style={{ width: Math.min(width * 0.75, 300), marginRight: 20 }}>
              <RollCard
                item={item}
                isGuest={activeTab === 'joined'}
                onPressCard={() => router.push(`/e/${item.short_code}?gallery=true`)}
                onPressCamera={() => router.push(`/e/${item.short_code}`)}
                onPressShare={() => handleShareInvite(item)}
                onPressManage={() => {
                  if (activeTab === 'created') {
                    router.push(`/manage/${item.id}` as any);
                  } else {
                    router.push(`/e/${item.short_code}`);
                  }
                }}
                onPressPreview={() => router.push(`/e/${item.short_code}`)}
              />
            </View>
          )}
        />
      </ScrollView>

      {/* Join Roll Modal */}
      <Modal
        visible={isJoinModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsJoinModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' }}
            onPress={() => setIsJoinModalVisible(false)}
          />

          <View style={{ backgroundColor: '#000', borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
            <View style={{ width: 48, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, alignSelf: 'center', marginBottom: 32 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <View>
                <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 28, color: '#fff', marginBottom: 4 }}>Join a Roll</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Enter the studio as a guest</Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsJoinModalVisible(false);
                }}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} color="#fff" />
              </Pressable>
            </View>

            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsJoinModalVisible(false);
                setTimeout(() => {
                  router.push('/scan');
                }, 300);
              }}
              style={{ width: '100%', backgroundColor: '#fff', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={24} color="#000" />
              </View>
              <View>
                <Text style={{ fontFamily: 'PlayfairDisplay_400Regular', fontSize: 20, color: '#000', marginBottom: 2 }}>Scan QR Code</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>Open camera to scan event code</Text>
              </View>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 3 }}>Or enter short code</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
              <TextInput
                placeholder="6-DIGIT CODE"
                placeholderTextColor="rgba(255,255,255,0.2)"
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 24, height: 64, color: '#fff', fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center', fontSize: 18 }}
                maxLength={6}
                value={shortCode}
                onChangeText={(text) => setShortCode(text.toUpperCase())}
                autoCapitalize="characters"
              />
              <Pressable
                style={{ width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: shortCode.length === 6 ? '#fff' : 'rgba(255,255,255,0.1)' }}
                disabled={shortCode.length !== 6}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setIsJoinModalVisible(false);
                  setTimeout(() => {
                    router.push(`/e/${shortCode}`);
                    setShortCode('');
                  }, 300);
                }}
              >
                <ArrowRight size={24} color={shortCode.length === 6 ? '#000' : 'rgba(255,255,255,0.3)'} />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Hidden view for capturing invite share image */}
      {shareItem && (
        <InviteCaptureView
          ref={viewShotRef}
          title={shareItem.title}
          dateStr={new Date(shareItem.reveal_at).toLocaleDateString()}
          inviteDetails={shareItem.invite_details || ''}
          coverPhotoUrl={shareItem.cover_photo_url || ''}
          shortCode={shareItem.short_code}
        />
      )}
    </View>
  );
}
