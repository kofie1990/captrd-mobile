import { LoadingState } from '@/components/ui/LoadingState';
import { supabase } from '@/lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import ShareNative, { Social, type ShareSingleOptions } from 'react-native-share';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ArrowLeft, X as CloseIcon, Download, Share, AlertTriangle, MoreHorizontal } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ReportModal } from './ReportModal';
import { UserActionSheet } from './UserActionSheet';
import { reportPhoto, getBlockedUsers } from '@/lib/moderation';
import { Alert, Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  FadeIn,
  FadeOut,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface FilmRollGalleryProps {
  eventData: any;
  onViewCamera: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLUMN_COUNT = SCREEN_W > 768 ? 3 : 2;
const GAP = 8;
const ITEM_WIDTH = (SCREEN_W - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

const resolveLocalUrl = (url: string | undefined) => {
  if (!url) return '';
  return Platform.OS === 'android' ? url.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : url;
};

const AnimatedImage = Animated.createAnimatedComponent(Image);

function ZoomableImage({ url }: { url: string }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = e.scale;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ] as any
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedImage source={{ uri: url }} style={[{ width: '100%', height: '100%' }, style as any]} contentFit="cover" />
      </Animated.View>
    </GestureDetector>
  );
}

function GalleryVideoItem({ url, isPlaying, style, isMuted = false }: { url: string, isPlaying: boolean, style: any, isMuted?: boolean }) {
  const player = useVideoPlayer(url, player => {
    player.loop = true;
    player.muted = isMuted;
    if (isPlaying) {
      player.play();
    }
  });

  useEffect(() => {
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, player]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  return (
    <View style={style}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="cover" />
    </View>
  );
}

// ─── Lightbox Component ───────────────────────────────────────────────────
function LightboxOverlay({ photos, initialIndex, onClose, onShare, onShareInstagram, onShareSnapchat, onSave, isProcessing, onReportPress, onMorePress }: any) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetY([-10, 10])
    .failOffsetX([-10, 10])
    .onChange((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationY) > 150 || Math.abs(event.velocityY) > 500) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateY.value),
      [0, 300],
      [1, 0.8],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateY: translateY.value },
        { scale },
      ] as any,
    };
  });

  const bgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(translateY.value),
      [0, 200],
      [1, 0],
      Extrapolation.CLAMP
    );
    return {
      backgroundColor: `rgba(0,0,0,${opacity})`,
    };
  });

  const activeMedia = photos[currentIndex];

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 100 }, bgStyle]} entering={FadeIn} exiting={FadeOut}>

      <Animated.View style={s.lbTopBar} entering={FadeIn.delay(200)} exiting={FadeOut}>
        <Pressable onPress={onClose} style={s.lbCloseBtn}>
          <CloseIcon size={24} color="#fff" />
        </Pressable>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onMomentumScrollEnd={(e) => {
            const newIdx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setCurrentIndex(newIdx);
          }}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View style={[{
              width: SCREEN_W,
              height: SCREEN_H - 170,
              backgroundColor: '#111',
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              overflow: 'hidden'
            }, animatedStyle]}>
              {item.media_type === 'video' ? (
                <GalleryVideoItem
                  url={resolveLocalUrl(item.storage_path)}
                  isPlaying={index === currentIndex}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <ZoomableImage url={resolveLocalUrl(item.storage_path)} />
              )}
            </Animated.View>
          )}
        />
      </GestureDetector>

      <Animated.View style={[s.lbBottom, { position: 'absolute', bottom: 0, left: 0, right: 0, height: 170, backgroundColor: '#000' }]} entering={FadeIn.delay(200)} exiting={FadeOut}>
        {activeMedia && (
          <>
            <View style={s.lbInfoCenter}>
              <Pressable onPress={() => onMorePress(activeMedia)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={s.lbGuestName}>{activeMedia.guest_name}</Text>
                <MoreHorizontal size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
              <Text style={s.lbTimestamp}>
                {new Date(activeMedia.created_at).toLocaleTimeString()}
              </Text>
            </View>

            <View style={s.lbActions}>
              <View style={s.socialRow}>
                <Pressable onPress={() => onShareInstagram(activeMedia)} disabled={isProcessing} style={[s.lbActionBtn, s.instaBtn]}>
                  <FontAwesome5 name="instagram" size={18} color="#000" />
                  <Text style={s.instaText}>Story</Text>
                </Pressable>

                <Pressable onPress={() => onShareSnapchat(activeMedia)} disabled={isProcessing} style={s.lbActionBtn}>
                  <FontAwesome5 name="snapchat-ghost" size={18} color="#fff" />
                </Pressable>
              </View>

              <View style={s.defaultActions}>
                <Pressable onPress={() => onReportPress(activeMedia)} style={s.lbActionBtn}>
                  <AlertTriangle size={20} color="#eab308" />
                </Pressable>
                <Pressable onPress={() => onShare(activeMedia)} disabled={isProcessing} style={s.lbActionBtn}>
                  <Share size={20} color="#fff" />
                </Pressable>
                <Pressable onPress={() => onSave(activeMedia)} disabled={isProcessing} style={s.lbActionBtn}>
                  {isProcessing ? <LoadingState.Spinner size={16} /> : <Download size={20} color="#fff" />}
                </Pressable>
              </View>
            </View>
          </>
        )}
      </Animated.View>

    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export function FilmRollGallery({ eventData, onViewCamera }: FilmRollGalleryProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);

  const fetchPhotos = async () => {
    try {
      const blockedIds = await getBlockedUsers();
      
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('event_id', eventData.id)
        .order('created_at', { ascending: false });
        
      if (data) {
        // Filter out photos from blocked users
        const filteredPhotos = data.filter(p => !blockedIds.includes(p.user_id));
        setPhotos(filteredPhotos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [eventData.id]);

  const handleReportSubmit = async (reason: string, details: string) => {
    if (!selectedMedia) return;
    await reportPhoto(selectedMedia.id, selectedMedia.user_id, reason, details);
  };


  const downloadToCache = async (url: string) => {
    const filename = url.split('/').pop() || `moment_${Date.now()}.jpg`;
    const file = new FileSystem.File(FileSystem.Paths.cache, filename);
    if (file.exists) return file.uri;
    const downloadedFile = await FileSystem.File.downloadFileAsync(url, file);
    return downloadedFile.uri;
  };

  const handleSave = async (media: any) => {
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need permission to save photos to your gallery.');
        return;
      }

      const localUri = await downloadToCache(media.storage_path);
      await MediaLibrary.saveToLibraryAsync(localUri);
      
      Alert.alert('Saved', 'Photo downloaded to your gallery.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareToApp = async (media: any) => {
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const localUri = await downloadToCache(media.storage_path);
      await Sharing.shareAsync(localUri, { dialogTitle: 'Share Captrd Moment', mimeType: 'image/jpeg' });
    } catch {
      Alert.alert('Error', 'Could not share image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareInstagram = async (media: any) => {
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const localUri = await downloadToCache(media.storage_path);
      
      try {
        const base64Data = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
        const base64Url = `data:image/jpeg;base64,${base64Data}`;
        await ShareNative.shareSingle({
          social: Social.InstagramStories,
          backgroundImage: base64Url,
          appId: '123456789'
        });
      } catch (err) {
        await ShareNative.shareSingle({
          social: Social.Instagram,
          url: localUri,
        } as ShareSingleOptions);
      }
    } catch (e: any) {
      if (e?.message !== 'User did not share') {
        Alert.alert('Error', 'Could not share to Instagram.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareSnapchat = async (media: any) => {
    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const localUri = await downloadToCache(media.storage_path);
      
      await ShareNative.shareSingle({
        social: Social.Snapchat,
        url: localUri,
      } as ShareSingleOptions);
    } catch (e: any) {
      if (e?.message !== 'User did not share') {
        Alert.alert('Error', 'Could not share to Snapchat.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const guestStats = photos.reduce((acc: Record<string, number>, p) => {
    acc[p.guest_name] = (acc[p.guest_name] || 0) + 1;
    return acc;
  }, {});
  const uniqueGuests = Object.keys(guestStats).length;

  if (loading) {
    return (
      <View style={s.root}>
        <LoadingState.Grid />
      </View>
    );
  }

  const columns: any[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  photos.forEach((photo, i) => {
    columns[i % COLUMN_COUNT].push(photo);
  });

  const isEnded = eventData.end_at ? new Date() >= new Date(eventData.end_at) : false;

  return (
    <View style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.hero}>
          {eventData.cover_photo_url ? (
            <Image
              source={{ uri: resolveLocalUrl(eventData.cover_photo_url) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={s.heroBgFallback} />
          )}

          <LinearGradient
            colors={['transparent', 'rgba(9,9,11,0.6)', '#09090b']}
            style={StyleSheet.absoluteFill}
          />

          <Pressable onPress={onViewCamera} style={s.backBtn}>
            <ArrowLeft size={16} color="#fff" />
            <Text style={s.backBtnText}>{isEnded ? 'Back' : 'Camera'}</Text>
          </Pressable>
        </View>

        <View style={s.titleSection}>
          <Text style={s.eventTitle}>{eventData.title}</Text>
          <Text style={s.eventSubtitle}>THE FILM ROLL IS DEVELOPED</Text>

          <View style={s.metricsRow}>
            <View style={s.metricBlock}>
              <Text style={s.metricNumber}>{photos.length}</Text>
              <Text style={s.metricLabel}>Total Pictures</Text>
            </View>
            <View style={s.metricDivider} />
            <View style={s.metricBlock}>
              <Text style={s.metricNumber}>{uniqueGuests}</Text>
              <Text style={s.metricLabel}>People Joined</Text>
            </View>
          </View>
        </View>

        {photos.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>The roll is empty.</Text>
            <Text style={s.emptySubtitle}>NO MEDIA WAS CAPTRD AT THIS EVENT.</Text>
          </View>
        ) : (
          <View style={s.masonryContainer}>
            {columns.map((colPhotos, colIndex) => (
              <View key={colIndex} style={s.masonryColumn}>
                {colPhotos.map((photo, index) => {
                  const isLarge = (colIndex + index) % 2 === 0;
                  const itemHeight = isLarge ? ITEM_WIDTH * 1.5 : ITEM_WIDTH * 1.1;

                  const rawIndex = photos.findIndex(p => p.id === photo.id);

                  return (
                    <Pressable
                      key={photo.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedIndex(rawIndex);
                      }}
                      style={[s.gridItem, { height: itemHeight }]}
                    >
                      {photo.media_type === 'video' ? (
                        <GalleryVideoItem
                          url={resolveLocalUrl(photo.storage_path)}
                          isPlaying={true}
                          isMuted={true}
                          style={StyleSheet.absoluteFill}
                        />
                      ) : (
                        <AnimatedImage
                          source={{ uri: resolveLocalUrl(photo.storage_path) }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          transition={200}
                        />
                      )}

                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                        style={s.gridGradient}
                      >
                        <Text style={s.gridGuestName}>{photo.guest_name}</Text>
                      </LinearGradient>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {selectedIndex !== null && (
        <LightboxOverlay
          photos={photos}
          initialIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onShare={handleShareToApp}
          onShareInstagram={handleShareInstagram}
          onShareSnapchat={handleShareSnapchat}
          onSave={handleSave}
          isProcessing={isProcessing}
          onReportPress={(media: any) => {
            setSelectedMedia(media);
            setReportModalVisible(true);
          }}
          onMorePress={(media: any) => {
            setSelectedMedia(media);
            setActionSheetVisible(true);
          }}
        />
      )}
      
      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSubmit={handleReportSubmit}
      />

      {selectedMedia && (
        <UserActionSheet
          visible={actionSheetVisible}
          onClose={() => setActionSheetVisible(false)}
          guestName={selectedMedia.guest_name}
          onReport={() => {
            setActionSheetVisible(false);
            setTimeout(() => setReportModalVisible(true), 300);
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },

  hero: { width: '100%', height: 350, position: 'relative', backgroundColor: '#111' },
  heroBgFallback: { ...StyleSheet.absoluteFill, backgroundColor: '#111' },
  backBtn: { position: 'absolute', top: 56, left: 16, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 10, opacity: 0.6 },
  backBtnText: { fontFamily: 'Inter_700Bold', fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: 2 },

  titleSection: { paddingHorizontal: 16, marginTop: -80, marginBottom: 32, zIndex: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 24 },
  eventTitle: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 48, color: '#fcfcfc', letterSpacing: -1, marginBottom: 4 },
  eventSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 24 },
  metricsRow: { flexDirection: 'row', alignItems: 'center' },
  metricBlock: { flexDirection: 'column', alignItems: 'flex-start' },
  metricNumber: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 32, color: '#fff' },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 },
  metricDivider: { height: 32, width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 24 },

  emptyState: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)', borderRadius: 48, marginHorizontal: 16, marginTop: 24 },
  emptyTitle: { fontFamily: 'PlayfairDisplay_400Regular_Italic', fontSize: 24, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2 },

  masonryContainer: { flexDirection: 'row', paddingHorizontal: GAP, gap: GAP },
  masonryColumn: { flex: 1, flexDirection: 'column', gap: GAP },
  gridItem: { width: '100%', backgroundColor: '#111', overflow: 'hidden', position: 'relative' },
  gridGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', justifyContent: 'flex-end', padding: 16, zIndex: 10 },
  gridGuestName: { fontFamily: 'PlayfairDisplay_400Regular_Italic', fontSize: 18, color: '#fff', opacity: 0.9, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4 },

  lbTopBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 56, paddingRight: 20, alignItems: 'flex-end', zIndex: 30 },
  lbCloseBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },

  lbBottom: { height: 160, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 24 },
  lbInfoCenter: { alignItems: 'center', marginBottom: 16 },
  lbGuestName: { fontFamily: 'PlayfairDisplay_400Regular_Italic', fontSize: 28, color: '#fff', marginBottom: 4 },
  lbTimestamp: { fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2 },
  lbActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 8 },
  socialRow: { flexDirection: 'row', gap: 12 },
  instaBtn: { width: 'auto', paddingHorizontal: 16, flexDirection: 'row', gap: 8, borderRadius: 18, backgroundColor: '#fff' },
  instaText: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#000' },
  defaultActions: { flexDirection: 'row', gap: 12 },
  lbActionBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
});
