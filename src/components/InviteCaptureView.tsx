import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Platform, Image as RNImage } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';

interface InviteCaptureViewProps {
  title: string;
  dateStr: string;
  inviteDetails: string;
  coverPhotoUrl: string;
  shortCode: string;
}

export const InviteCaptureView = forwardRef<any, InviteCaptureViewProps>(
  ({ title, dateStr, inviteDetails, coverPhotoUrl, shortCode }, ref) => {
    // Determine the cover URL (handle local IP mapping for android if needed)
    const coverUrl = Platform.OS === 'android' && coverPhotoUrl 
      ? coverPhotoUrl.replace('127.0.0.1', '10.0.2.2').replace('localhost', '10.0.2.2') 
      : (coverPhotoUrl || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop");

    return (
      <ViewShot 
        ref={ref} 
        options={{ format: 'jpg', quality: 0.9 }} 
        style={styles.container}
      >
        <View style={styles.cardContainer}>
          {/* Background Image */}
          <RNImage source={{ uri: coverUrl }} style={styles.backgroundImage} resizeMode="cover" />
          <View style={styles.overlay} />

          {/* Bottom Content */}
          <View style={styles.bottomContent}>
            <LinearGradient 
              colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']} 
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.textContent}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.date}>{dateStr}</Text>

              <View style={styles.detailsBox}>
                <Text style={styles.detailsText}>"{inviteDetails || "We can't wait to celebrate with you!"}"</Text>
              </View>

              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>JOIN CODE</Text>
                <Text style={styles.codeValue}>{shortCode}</Text>
              </View>
            </View>
          </View>
        </View>
      </ViewShot>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    // Keep it off-screen but mounted
    position: 'absolute',
    left: -4000,
    top: 0,
    width: 1200,
    height: 2100,
    backgroundColor: '#000',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  textContent: {
    padding: 96,
    paddingBottom: 144,
    paddingTop: 192,
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 144,
    color: '#fff',
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
    letterSpacing: -3,
  },
  date: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 72,
    textTransform: 'uppercase',
    letterSpacing: 6,
  },
  detailsBox: {
    padding: 60,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 3,
    borderRadius: 72,
    marginBottom: 72,
  },
  detailsText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 48,
    lineHeight: 72,
  },
  codeBox: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 48,
    borderRadius: 999,
    width: '100%',
  },
  codeLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: 'rgba(0,0,0,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 6,
    marginBottom: 6,
  },
  codeValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 60,
    color: '#000',
    letterSpacing: 12,
  }
});
