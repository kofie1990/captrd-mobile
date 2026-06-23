import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, Image as RNImage, Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'The Invite',
    step: '01',
    description: 'Send a beautiful invite to your friends to join the roll.',
    image: require('../../assets/images/wedding_invite.png'),
  },
  {
    id: '2',
    title: 'The Captr',
    step: '02',
    description: 'Snap photos all night long. No retakes, no filters, just raw moments.',
    image: require('../../assets/images/wedding_camera.png'),
  },
  {
    id: '3',
    title: 'The Reveal',
    step: '03',
    description: 'Wake up to a shared gallery of everyone\'s photos from the event.',
    image: require('../../assets/images/wedding_gallary.png'),
  },
  {
    id: '4',
    title: 'The Memories',
    step: '04',
    description: 'Relive the night from every perspective. Download and share your favorites.',
    image: require('../../assets/images/wedding_pictureview.png'),
  },
];

export default function OnboardingScreen() {
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<any>>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      Haptics.selectionAsync();
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item, index }) => {
          return <Slide item={item} index={index} scrollX={scrollX} />;
        }}
      />

      {/* Bottom Navigation & CTA */}
      <View className="absolute bottom-12 left-0 right-0 px-8 items-center" pointerEvents="box-none">

        {/* Pagination Dots */}
        <View className="flex-row justify-center mb-6 gap-2">
          {SLIDES.map((_, i) => {
            const dotStyle = useAnimatedStyle(() => {
              const opacity = interpolate(
                scrollX.value,
                [(i - 1) * width, i * width, (i + 1) * width],
                [0.3, 1, 0.3],
                Extrapolation.CLAMP
              );
              const dotWidth = interpolate(
                scrollX.value,
                [(i - 1) * width, i * width, (i + 1) * width],
                [6, 24, 6],
                Extrapolation.CLAMP
              );
              return { opacity, width: dotWidth };
            });

            return (
              <Animated.View
                key={i}
                className="h-1.5 rounded-full bg-white mx-0.5"
                style={dotStyle}
              />
            );
          })}
        </View>

        {/* Get Started / Next Button */}
        <Pressable
          onPress={handleNext}
          className="w-full bg-white/10 backdrop-blur-md border border-white/20 py-4 rounded-full flex-row items-center justify-center gap-2 active:bg-white/20 transition-colors shadow-2xl"
        >
          <Text className="font-mono text-xs uppercase tracking-widest font-bold text-white">
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
          {currentIndex !== SLIDES.length - 1 && <ArrowRight size={16} color="#fff" />}
        </Pressable>
      </View>
    </View>
  );
}

function Slide({ item, index, scrollX }: { item: typeof SLIDES[0], index: number, scrollX: SharedValue<number> }) {
  // Parallax effect for the image
  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [width * 0.3, 0, -width * 0.3],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX }],
    };
  });

  // Slide-in effect for the text panel
  const textAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [index % 2 === 0 ? 50 : -50, 0, index % 2 === 0 ? 50 : -50],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0, 1, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  // Calculate dynamic placement to match web
  let topPosition;
  let leftPosition;
  let rightPosition;
  let bottomPosition;

  if (index === 0) {
    topPosition = height * 0.15;
    rightPosition = width * 0.05;
  } else if (index === 1) {
    topPosition = height * 0.25;
    leftPosition = width * 0.05;
  } else if (index === 2) {
    bottomPosition = height * 0.35;
    rightPosition = width * 0.05;
  } else if (index === 3) {
    topPosition = height * 0.2;
    leftPosition = width * 0.05;
  }

  return (
    <View style={{ width, height }} className="items-center justify-center relative pb-20">

      {/* Background Phone Image - No container crop */}
      <Animated.View
        style={[imageAnimatedStyle, { width: width * 0.9, height: height * 0.75 }]}
        className="absolute"
      >
        <RNImage source={item.image} className="w-full h-full" resizeMode="contain" />
      </Animated.View>

      {/* Floating Glass Text Panel */}
      <Animated.View
        style={[
          textAnimatedStyle,
          {
            position: 'absolute',
            top: topPosition,
            bottom: bottomPosition,
            left: leftPosition,
            right: rightPosition,
            width: width * 0.6
          }
        ]}
      >
        <View className="rounded-2xl overflow-hidden shadow-2xl">
          <BlurView
            intensity={90}
            tint="dark"
            className="border border-white/20 bg-black/40"
          >
            <View className="p-5">
              <Text className="font-mono text-[9px] text-white/50 uppercase tracking-widest mb-1 drop-shadow-md">
                {item.step} // {item.title}
              </Text>
              <Text className="text-[13px] font-light text-white/90 leading-snug drop-shadow-lg">
                {item.description}
              </Text>
            </View>
          </BlurView>
        </View>
      </Animated.View>

    </View>
  );
}
