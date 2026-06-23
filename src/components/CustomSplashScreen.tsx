import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { Dimensions, View } from 'react-native';

interface CustomSplashScreenProps {
  onFinish: () => void;
}

export function CustomSplashScreen({ onFinish }: CustomSplashScreenProps) {
  const animation = useRef<LottieView>(null);
  const { width } = Dimensions.get('window');

  // Trigger a subtle haptic when the splash screen first appears
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleAnimationFinish = () => {
    // Play a satisfying success haptic when the logo finishes drawing
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFinish();
  };

  return (
    <View className="flex-1 items-center justify-center bg-black absolute inset-0 z-50">
      <LottieView
        ref={animation}
        source={require('../../assets/images/logo.json')}
        autoPlay
        loop={false}
        style={{
          width: width * 0.4,
          height: width * 0.4,
        }}
        onAnimationFinish={handleAnimationFinish}
        resizeMode="contain"
      />
    </View>
  );
}
