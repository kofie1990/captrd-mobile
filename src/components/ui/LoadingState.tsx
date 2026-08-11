import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { isClip } from 'react-native-app-clip';
const LottieView = !isClip() ? require('lottie-react-native').default : null;
import { Skeleton } from 'moti/skeleton';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = width > 768 ? 3 : 2;
const GAP = 8;
const ITEM_WIDTH = (width - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

// --- Spinner ---
export const LoadingSpinner = ({ size = 48, style }: { size?: number, style?: any }) => {
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {!isClip() ? (
        <LottieView
          source={require('../../../assets/images/logo.json')}
          autoPlay
          loop
          style={{ width: '100%', height: '100%' }}
        />
      ) : null}
    </View>
  );
};

// --- Screen Loader ---
export const LoadingScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#09090b', paddingTop: 80, paddingHorizontal: 24 }}>
      {/* Header Skeleton */}
      <View style={{ marginBottom: 32 }}>
        <Skeleton colorMode="dark" width={150} height={20} radius={4} />
        <View style={{ height: 12 }} />
        <Skeleton colorMode="dark" width={250} height={40} radius={8} />
      </View>
      
      {/* Cards Skeleton */}
      <View style={{ flexDirection: 'row', gap: 20 }}>
        <View>
          <Skeleton colorMode="dark" width={280} height={380} radius={24} />
        </View>
        <View>
          <Skeleton colorMode="dark" width={280} height={380} radius={24} />
        </View>
      </View>
    </View>
  );
};

// --- Grid Loader (For Galleries) ---
export const LoadingGrid = () => {
  const columns: number[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  Array.from({ length: 8 }).forEach((_, i) => {
    columns[i % COLUMN_COUNT].push(i);
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b', paddingHorizontal: GAP, flexDirection: 'row', gap: GAP, paddingTop: 20 }}>
      {columns.map((col, colIndex) => (
        <View key={colIndex} style={{ flex: 1, flexDirection: 'column', gap: GAP }}>
          {col.map((_, index) => {
            const isLarge = (colIndex + index) % 2 === 0;
            const itemHeight = isLarge ? ITEM_WIDTH * 1.5 : ITEM_WIDTH * 1.1;
            return (
              <View key={index} style={{ marginBottom: GAP }}>
                <Skeleton colorMode="dark" width="100%" height={itemHeight} radius={12} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

// --- Manage Screen Loader ---
export const LoadingManageScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Hero Header Skeleton */}
      <Skeleton colorMode="dark" width="100%" height={256} radius={0} />
      
      <View style={{ padding: 24, gap: 32 }}>
        {/* Status Card Skeleton */}
        <Skeleton colorMode="dark" width="100%" height={150} radius={32} />
        
        {/* Share Section Skeleton */}
        <Skeleton colorMode="dark" width="100%" height={200} radius={32} />
        
        {/* Aesthetics Filter Skeleton */}
        <Skeleton colorMode="dark" width="100%" height={250} radius={32} />
      </View>
    </View>
  );
};

export const LoadingState = {
  Spinner: LoadingSpinner,
  Screen: LoadingScreen,
  Grid: LoadingGrid,
  ManageScreen: LoadingManageScreen,
};
