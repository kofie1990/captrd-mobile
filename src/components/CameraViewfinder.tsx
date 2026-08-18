import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { CameraType, CameraView, FlashMode, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Camera, Check, Grid3x3, Image as ImageIcon, RefreshCcw, X, Zap, ZapOff, UploadCloud } from 'lucide-react-native';
import { FailedUpload, saveFailedUpload, getFailedUploads, deleteFailedUpload } from '@/lib/failedUploads';
import { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, FadeInUp, FadeOutUp, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import CaptrdLiveActivityFactory from '../../widgets/CaptrdLiveActivity';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface CameraViewfinderProps {
  eventId: string;
  guestName: string;
  filter?: string;
  isRevealed: boolean;
  latestPhotoUrl?: string;
  eventName?: string;
  onViewGallery: () => void;
  onPhotoTaken?: (url: string) => void;
  maxPhotos: number;
}

export function CameraViewfinder({
  eventId,
  guestName,
  filter,
  isRevealed,
  latestPhotoUrl: initialLatestPhoto,
  eventName,
  onViewGallery,
  onPhotoTaken,
  maxPhotos
}: CameraViewfinderProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [type, setType] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [uploadQueue, setUploadQueue] = useState(0);
  const [pendingUploads, setPendingUploads] = useState<FailedUpload[]>([]);
  
  useEffect(() => {
    getFailedUploads().then(uploads => setPendingUploads(uploads.filter(u => u.eventId === eventId)));
  }, [eventId]);

  const [latestPhoto, setLatestPhoto] = useState<string | undefined>(initialLatestPhoto);
  const [photoCount, setPhotoCount] = useState(0);

  // Animation for counter
  const scale = useSharedValue(1);
  const prevPhotoCount = useRef(photoCount);

  useEffect(() => {
    if (photoCount > prevPhotoCount.current) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 4, stiffness: 120 }),
        withSpring(1, { damping: 10, stiffness: 100 })
      );
    }
    prevPhotoCount.current = photoCount;

    // Update Live Activity
    if (Platform.OS === 'ios') {
      try {
        const instances = CaptrdLiveActivityFactory.getInstances();
        instances.forEach(instance => {
          const left = Math.max(0, maxPhotos - photoCount);
          instance.update({
            eventName: eventName || 'Captrd Roll',
            picturesLeft: left
          });
          
          if (left === 0) {
            instance.end('default');
          }
        });
      } catch (e) {
        console.error("Failed to update Live Activity", e);
      }
    }
  }, [photoCount, scale, eventName, maxPhotos]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const spinnerRotation = useSharedValue(0);
  useEffect(() => {
    if (uploadQueue > 0) {
      spinnerRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1
      );
    } else {
      spinnerRotation.value = 0;
    }
  }, [uploadQueue, spinnerRotation]);

  const spinnerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinnerRotation.value}deg` }]
    };
  });

  const photosLeft = Math.max(0, maxPhotos - photoCount);

  const [showFlash, setShowFlash] = useState(false);
  const [showGrid, setShowGrid] = useState(false);

  // Video state
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>('photo');
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(10);
  const recordingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preview state (review before upload, matching web)
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewMediaType, setPreviewMediaType] = useState<'photo' | 'video'>('photo');
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // Setup video player
  const player = useVideoPlayer(previewUri || '', player => {
    player.loop = true;
    if (previewUri && previewMediaType === 'video') player.play();
  });

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('guest_name', guestName);
      if (count !== null) setPhotoCount(count);
    };
    fetchCount();
  }, [eventId, guestName]);

  useEffect(() => {
    if (initialLatestPhoto) {
      setLatestPhoto(initialLatestPhoto);
    }
  }, [initialLatestPhoto]);

  // ─── Permission: loading ──────────────────────────────────────────────
  if (!permission || !micPermission) {
    return <View style={s.root} />;
  }

  // ─── Permission: not granted ──────────────────────────────────────────
  if (!permission.granted || !micPermission.granted) {
    return (
      <View style={s.root}>
        <View style={s.permWrap}>
          <View style={s.permIcon}>
            <Camera size={48} color="#fff" />
          </View>
          <Text style={s.permTitle}>Camera Access</Text>
          <Text style={s.permSub}>
            We need your camera and microphone to capture moments for this roll.
          </Text>
          <Pressable onPress={() => { requestPermission(); requestMicPermission(); }} style={s.permBtn}>
            <Text style={s.permBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Actions ──────────────────────────────────────────────────────────
  const toggleCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setType(c => (c === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash(c => (c === 'off' ? 'on' : 'off'));
  };

  const handleCaptureClick = async () => {
    if (photoCount >= maxPhotos) {
      Alert.alert('Roll Complete', "You've reached your limit for this event.");
      return;
    }

    if (captureMode === 'photo') {
      if (!cameraRef.current || isCapturing) return;
      try {
        setIsCapturing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          exif: false,
        });

        if (!photo || !photo.base64) throw new Error('Capture failed');
        setPreviewMediaType('photo');
        setPreviewUri(photo.uri);
        setPreviewBase64(photo.base64);
      } catch (error) {
        console.error('Capture error:', error);
        Alert.alert('Error', 'Failed to capture. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    } else {
      // Video mode
      if (recording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRecording(true);
      setRecordingTime(10);

      let timeLeft = 10;
      recordingIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        setRecordingTime(timeLeft);
        if (timeLeft <= 0) {
          stopRecording();
        }
      }, 1000);

      const video = await cameraRef.current.recordAsync({ maxDuration: 10 });
      if (video) {
        setPreviewMediaType('video');
        setPreviewUri(video.uri);
      }
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to record video.');
      setRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording();
    }
    setRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const retake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewUri(null);
    setPreviewBase64(null);
    if (player) player.pause();
  };

  const handleSave = () => {
    if (!previewUri) return;
    
    const uriToUpload = previewUri;
    const mediaTypeToUpload = previewMediaType;
    const base64ToUpload = previewBase64;
    
    // Eagerly update UI
    setLatestPhoto(uriToUpload);
    setPreviewUri(null);
    setPreviewBase64(null);
    if (player) player.pause();
    
    setUploadQueue(prev => prev + 1);
    processUpload(uriToUpload, mediaTypeToUpload, base64ToUpload);
  };

  const retryPendingUploads = async () => {
    if (pendingUploads.length === 0) return;
    
    // Refresh session to avoid RLS/token expiration errors
    await supabase.auth.getSession();

    const currentPending = [...pendingUploads];
    setPendingUploads([]); // Optimistically clear
    let failedAgain: FailedUpload[] = [];

    for (const item of currentPending) {
       try {
         setUploadQueue(prev => prev + 1);
         
         let fileData: string;
         if (item.isVideo) {
           fileData = await new File(item.uri).base64();
         } else {
           fileData = await FileSystem.readAsStringAsync(item.uri, { encoding: FileSystem.EncodingType.Base64 });
         }

         const contentType = item.isVideo ? 'video/mp4' : 'image/jpeg';

         const { error: uploadError } = await supabase.storage
           .from('event-photos')
           .upload(item.fileName, decode(fileData), { contentType, upsert: true });
           
         if (uploadError) throw uploadError;

         const { data: publicUrlData } = supabase.storage.from('event-photos').getPublicUrl(item.fileName);
         
         const { error: dbError } = await supabase.from('photos').insert([{
           event_id: item.eventId,
           guest_name: item.guestName,
           storage_path: publicUrlData.publicUrl,
           media_type: item.isVideo ? 'video' : 'image'
         }]);

         if (dbError) throw dbError;

         await deleteFailedUpload(item.id);
       } catch (e) {
         console.error("Retry failed for", item.fileName, e);
         failedAgain.push(item);
       } finally {
         setUploadQueue(prev => Math.max(0, prev - 1));
       }
    }
    
    if (failedAgain.length > 0) {
      setPendingUploads(failedAgain);
      Alert.alert('Retry Failed', `${failedAgain.length} uploads still failed. Please check your connection and try again.`);
    } else {
      Alert.alert('Success', 'All failed uploads were successfully retried!');
      setPhotoCount(prev => prev + currentPending.length - failedAgain.length);
    }
  };

  const processUpload = async (uri: string, mediaType: 'photo' | 'video', base64: string | null) => {
    const ext = mediaType === 'video' ? 'mp4' : 'jpg';
    const fileName = `${eventId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    try {
      // Ensure session is fresh before uploading
      await supabase.auth.getSession();

      let fileData: string;
      let contentType: string;

      if (mediaType === 'video') {
        fileData = await new File(uri).base64();
        contentType = 'video/mp4';
      } else {
        if (!base64) throw new Error('Base64 missing');
        fileData = base64;
        contentType = 'image/jpeg';
      }

      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(fileName, decode(fileData), {
          contentType,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('event-photos').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const { error: dbError } = await supabase.from('photos').insert({
        event_id: eventId,
        guest_name: guestName,
        storage_path: publicUrl,
        media_type: mediaType,
      });
      if (dbError) throw dbError;

      // Make sure latest photo matches remote if it hasn't been overwritten
      setLatestPhoto(currentLatest => currentLatest === uri ? publicUrl : currentLatest);
      
      if (onPhotoTaken) onPhotoTaken(publicUrl);
      setPhotoCount(prev => prev + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Upload error:', error);
      const failedItem: FailedUpload = {
        id: fileName,
        uri: '', // Will be set by saveFailedUpload
        fileName,
        eventId,
        guestName,
        isVideo: mediaType === 'video',
        timestamp: Date.now()
      };
      await saveFailedUpload(failedItem, uri);
      setPendingUploads(prev => [...prev, failedItem]);
      Alert.alert('Upload Error', 'Failed to upload, but your photo was saved locally and can be retried later.');
    } finally {
      setUploadQueue(prev => Math.max(0, prev - 1));
    }
  };

  const atLimit = photoCount >= maxPhotos;
  const isReviewing = !!previewUri;

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <View style={s.cameraWrapper}>
        {!isReviewing && (
          <CameraView
            mode={captureMode === 'video' ? 'video' : 'picture'}
            style={StyleSheet.absoluteFill}
            facing={type}
            flash={flash}
            ref={cameraRef}
            mirror={type === 'front' ? true : false}
          />
        )}

        {isReviewing && previewMediaType === 'photo' && (
          <Image
            source={{ uri: previewUri! }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        )}

        {isReviewing && previewMediaType === 'video' && (
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
            contentFit="cover"
          />
        )}

        {showFlash && <View style={s.flashOverlay} />}

        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={s.topBar}
        >
          <View>
            <Text style={s.topBarName}>{guestName}&apos;s Roll</Text>
            <Text style={s.topBarCount}>{photoCount} / {maxPhotos} EXPOSURES</Text>
          </View>
          <View style={s.topBarRight}>
            {!isReviewing && (
              <Pressable onPress={toggleFlash} style={s.topBtn}>
                {flash === 'on' ? <Zap size={20} color="#facc15" /> : <ZapOff size={20} color="rgba(255,255,255,0.7)" />}
              </Pressable>
            )}
            {!isReviewing && (
              <Pressable onPress={() => { Haptics.selectionAsync(); setShowGrid(!showGrid); }} style={[s.topBtn, showGrid && s.topBtnActive]}>
                <Grid3x3 size={20} color="#fff" />
              </Pressable>
            )}
            <Pressable onPress={toggleCamera} style={s.topBtn}>
              <RefreshCcw size={20} color="#fff" />
            </Pressable>
          </View>
        </LinearGradient>

        {uploadQueue > 0 && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            exiting={FadeOutUp.duration(300)}
            style={s.toastOverlay}
          >
            <Animated.View style={spinnerAnimatedStyle}>
              <RefreshCcw size={14} color="#fff" />
            </Animated.View>
            <Text style={s.toastText}>
              {uploadQueue} upload{uploadQueue > 1 ? 's' : ''} in progress...
            </Text>
          </Animated.View>
        )}

        {pendingUploads.length > 0 && uploadQueue === 0 && (
          <Animated.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(300)} style={[s.toastOverlay, { backgroundColor: 'rgba(239,68,68,0.8)', borderColor: 'rgba(239,68,68,0.5)' }]}>
            <Pressable onPress={retryPendingUploads} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <UploadCloud size={14} color="#fff" />
              <Text style={[s.toastText, { fontFamily: 'Inter_700Bold' }]}>
                Retry {pendingUploads.length} Failed
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {!isReviewing && (
          <View style={s.vfOverlay} pointerEvents="none">
            {showGrid && (
              <>
                <View style={[s.gridLine, { left: '33.33%', top: 0, bottom: 0, width: 1 }]} />
                <View style={[s.gridLine, { left: '66.66%', top: 0, bottom: 0, width: 1 }]} />
                <View style={[s.gridLine, { top: '33.33%', left: 0, right: 0, height: 1 }]} />
                <View style={[s.gridLine, { top: '66.66%', left: 0, right: 0, height: 1 }]} />
              </>
            )}
            <View style={s.vfFrame}>
              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />
              <View style={s.reticleWrap}>
                <View style={[s.reticleRing, recording && { borderColor: '#ef4444' }]} />
                <View style={[s.reticleDot, recording && { backgroundColor: '#ef4444' }]} />
              </View>
            </View>

            {recording && (
              <View style={s.recordingTimer}>
                <View style={s.recordingDot} />
                <Text style={s.recordingTimeText}>00:{recordingTime.toString().padStart(2, '0')}</Text>
              </View>
            )}

            {atLimit && (
              <View style={s.limitOverlay}>
                <Text style={s.limitTitle}>Roll Complete</Text>
                <Text style={s.limitSub}>You've reached your limit</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ═══ Bottom Controls ═══ */}
      <View style={s.bottomBar}>
        {/* Left: Gallery Thumbnail */}
        <View style={s.thumbWrap}>
          {isRevealed && onViewGallery ? (
            <Pressable onPress={onViewGallery} style={s.thumbBtn}>
              {latestPhoto ? (
                <Image source={{ uri: Platform.OS === 'android' ? latestPhoto.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') : latestPhoto }} style={s.thumbImg} contentFit="cover" />
              ) : (
                <View style={s.thumbEmpty}>
                  <ImageIcon size={22} color="rgba(255,255,255,0.4)" />
                </View>
              )}
            </Pressable>
          ) : (
            <View style={s.thumbSpacer} />
          )}
        </View>

        {/* Center: Absolutely centered shutter + mode switcher */}
        {!isReviewing ? (
          <View style={s.shutterCenter} pointerEvents="box-none">
            {/* Mode Switcher floating above */}
            {!recording && (
              <View style={s.modeSwitcher}>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setCaptureMode('photo'); }}
                  style={[s.modeBtn, captureMode === 'photo' && s.modeBtnActive]}
                >
                  <Text style={[s.modeBtnText, captureMode === 'photo' && s.modeBtnTextActive]}>Photo</Text>
                </Pressable>
                <Pressable
                  onPress={() => { Haptics.selectionAsync(); setCaptureMode('video'); }}
                  style={[s.modeBtn, captureMode === 'video' && s.modeBtnActive]}
                >
                  <Text style={[s.modeBtnText, captureMode === 'video' && s.modeBtnTextActive]}>Video</Text>
                </Pressable>
              </View>
            )}

            {/* Shutter */}
            <Pressable
              onPress={handleCaptureClick}
              disabled={isCapturing || atLimit}
              style={[
                s.shutterOuter,
                atLimit && s.shutterDisabled,
                isCapturing && { transform: [{ scale: 0.95 }], opacity: 0.8 },
              ]}
            >
              <View style={[
                s.shutterInner,
                captureMode === 'video' && s.shutterInnerVideo,
                recording && s.shutterInnerRecording,
              ]} />
            </Pressable>
          </View>
        ) : (
          <View style={s.reviewCenter} pointerEvents="box-none">
            <Pressable
              onPress={retake}
              style={[s.reviewBtn, s.reviewBtnRetake]}
            >
              <X size={28} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[s.reviewBtn, s.reviewBtnAccept]}
            >
              <Check size={28} color="#000" />
            </Pressable>
          </View>
        )}

        {/* Right: Remaining Photos Counter */}
        <View style={s.thumbWrap}>
          {!isReviewing && (
            <Animated.View style={[s.counterBadge, animatedStyle]}>
              <Text style={s.counterNum}>{photosLeft}</Text>
              <Text style={s.counterLabel}>LEFT</Text>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const CORNER_SIZE = 28;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'column',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#111',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },

  /* Flash */
  flashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#fff',
    zIndex: 100,
  },

  /* ── Permission ─────────────────────────────────────── */
  permWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  permIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  permTitle: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 28, color: '#fff', marginBottom: 12 },
  permSub: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', marginBottom: 32, lineHeight: 20,
  },
  permBtn: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 999 },
  permBtnText: {
    fontFamily: 'Inter_700Bold', fontSize: 12, color: '#000',
    textTransform: 'uppercase', letterSpacing: 2,
  },

  /* ── Top Bar ────────────────────────────────────────── */
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    zIndex: 10,
  },
  topBarName: {
    fontFamily: 'Inter_700Bold', fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase', letterSpacing: 2,
  },
  topBarCount: {
    fontFamily: 'Inter_400Regular', fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase', letterSpacing: 2, marginTop: 2,
  },
  topBarRight: { flexDirection: 'row', gap: 8 },
  topBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  topBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)' },

  /* ── Toast ──────────────────────────────────────────── */
  toastOverlay: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  toastText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.5,
  },

  /* ── Viewfinder Overlay ─────────────────────────────── */
  vfOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
  },

  /* Grid lines */
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  /* Rounded frame with corners */
  vfFrame: {
    position: 'absolute',
    top: 32, bottom: 32, left: 16, right: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 24, left: 24,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 24, right: 24,
    borderTopWidth: 2, borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 24, left: 24,
    borderBottomWidth: 2, borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 24, right: 24,
    borderBottomWidth: 2, borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderBottomRightRadius: 8,
  },

  /* Center reticle */
  reticleWrap: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: 56, height: 56,
    marginTop: -28, marginLeft: -28,
    alignItems: 'center', justifyContent: 'center',
  },
  reticleRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  reticleDot: {
    position: 'absolute',
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  /* Limit overlay */
  limitOverlay: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: 240, marginLeft: -120, marginTop: -48,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 24, paddingVertical: 24, paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  limitTitle: {
    fontFamily: 'PlayfairDisplay_400Regular', fontSize: 22, color: '#fff',
    marginBottom: 6, textAlign: 'center',
  },
  limitSub: {
    fontFamily: 'Inter_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center',
  },

  /* Recording Timer */
  recordingTimer: {
    position: 'absolute',
    top: 100, left: '50%',
    width: 80, marginLeft: -40,
    backgroundColor: '#ef4444',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  recordingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  recordingTimeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#fff', letterSpacing: 1 },

  /* ── Bottom Bar ─────────────────────────────────────── */
  bottomBar: {
    height: 170,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingBottom: 32,
    zIndex: 10,
    position: 'relative',
  },

  /* Gallery thumbnail */
  thumbWrap: { width: 56, height: 56, zIndex: 5 },
  thumbBtn: {
    width: 56, height: 56, borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: '#222',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbEmpty: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  thumbSpacer: { width: 56, height: 56 },

  /* Shutter — absolutely centered in bottom bar */
  shutterCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -60,
    alignItems: 'center',
    zIndex: 10,
  },

  /* Mode Switcher — floating pill above shutter */
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 999,
  },
  modeBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modeBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  modeBtnTextActive: { color: '#000' },

  /* Shutter button */
  shutterOuter: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    padding: 4,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  shutterDisabled: { borderColor: 'rgba(255,255,255,0.15)', opacity: 0.3 },
  shutterInner: {
    width: '100%', height: '100%', borderRadius: 999,
    backgroundColor: '#fff',
  },
  shutterInnerVideo: {
    backgroundColor: '#ef4444',
  },
  shutterInnerRecording: {
    width: 28, height: 28,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },

  /* Review actions — absolutely centered */
  reviewCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -30,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  reviewBtn: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  reviewBtnRetake: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  reviewBtnAccept: {
    backgroundColor: '#fff',
  },
  reviewBtnSaving: {
    fontFamily: 'Inter_700Bold', fontSize: 9,
    color: '#000', letterSpacing: 2,
  },

  /* Counter Badge */
  counterBadge: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  counterNum: {
    fontFamily: 'PlayfairDisplay_400Regular', fontSize: 20, color: '#fff',
    lineHeight: 24,
  },
  counterLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 8, color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase', letterSpacing: 1,
  },
});
