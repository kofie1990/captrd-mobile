import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <LoadingState.Screen />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>We need your permission to show the camera.</Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Parse the data (e.g., https://captrd.com/e/ABCDEF or just ABCDEF)
    let shortCode = data;
    if (data.includes('/e/')) {
      const parts = data.split('/e/');
      shortCode = parts[parts.length - 1];
    }
    
    // Quick delay before navigating to let the user see it worked
    setTimeout(() => {
      router.replace(`/e/${shortCode}`);
    }, 500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <CameraView
        style={styles.container}
        facing="back"
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={[styles.overlayBlock, styles.overlayTop]}>
          <View style={styles.header}>
            <Pressable 
              onPress={() => router.back()}
              style={styles.iconButton}
            >
              <ArrowLeft color="#fff" size={24} />
            </Pressable>
            <View style={styles.titleContainer}>
               <Text style={styles.title}>Scan QR Code</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>

        <View style={styles.overlayMiddleRow}>
          <View style={styles.overlayBlock} />
          
          <View style={styles.scanTarget}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <View style={styles.overlayBlock} />
        </View>

        <View style={[styles.overlayBlock, styles.overlayBottom]}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Align the QR code within the frame to join</Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionText: {
    fontFamily: 'Inter_400Regular',
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginBottom: 16,
  },
  permissionButtonText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  
  // Overlay Styles
  overlayBlock: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  overlayTop: {
    justifyContent: 'flex-start',
  },
  overlayBottom: {
    justifyContent: 'flex-end',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    color: '#fff',
    fontSize: 22,
  },
  
  // Scan Target
  scanTarget: {
    width: 280,
    height: 280,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 24,
  },
  
  // Footer
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
