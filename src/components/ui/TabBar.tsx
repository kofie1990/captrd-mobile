import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Aperture, Compass, PackageOpen, Plus, UserCircle } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width } = Dimensions.get('window');

const ICONS: Record<string, React.FC<any>> = {
  dashboard: Compass,
  studio: Aperture,
  order: PackageOpen,
  profile: UserCircle,
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const rotation = useSharedValue(0);
  const router = useRouter();

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const visibleRoutes = state.routes.filter(route => {
    const { options } = descriptors[route.key] as any;
    return options.tabBarItemStyle?.display !== 'none' && options.href !== null;
  });

  const isOddLayout = visibleRoutes.length % 2 !== 0;
  const half = Math.ceil(visibleRoutes.length / 2);
  const routesLeft = visibleRoutes.slice(0, half);
  const routesRight = visibleRoutes.slice(half);

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 20) }} className="absolute bottom-0 w-full items-center px-6 pointer-events-box-none">
      <View className="flex-row items-center justify-center pointer-events-box-none relative w-full max-w-[400px]">
        <BlurView
          intensity={80}
          tint="dark"
          style={{
            height: 70,
            borderRadius: 35,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            width: '100%',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(0,0,0,0.9)'
          }}
        >
          {isOddLayout ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingRight: 72 }}>
              {visibleRoutes.map((route) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
                const Icon = ICONS[route.name] || LayoutDashboard;
                return <TabItem key={route.key} route={route} isFocused={isFocused} navigation={navigation} Icon={Icon} label={options.title || route.name} />;
              })}
            </View>
          ) : (
            <>
              <View className="flex-row items-center gap-8">
                {routesLeft.map((route) => {
                  const { options } = descriptors[route.key];
                  const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
                  const Icon = ICONS[route.name] || LayoutDashboard;
                  return <TabItem key={route.key} route={route} isFocused={isFocused} navigation={navigation} Icon={Icon} label={options.title || route.name} />;
                })}
              </View>

              {/* Spacer for central button */}
              <View style={{ width: 1 }} />

              <View className="flex-row items-center gap-8">
                {routesRight.map((route) => {
                  const { options } = descriptors[route.key];
                  const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
                  const Icon = ICONS[route.name] || LayoutDashboard;
                  return <TabItem key={route.key} route={route} isFocused={isFocused} navigation={navigation} Icon={Icon} label={options.title || route.name} />;
                })}
              </View>
            </>
          )}
        </BlurView>

        {/* Elevated Unique Center Button */}
        <View className={`absolute z-50 items-center justify-center -top-3 pointer-events-auto ${isOddLayout ? 'right-4' : 'left-1/2 -ml-8'}`}>
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/create');
            }}
            className="w-16 h-16 rounded-[1.5rem] items-center justify-center"
            style={{
              shadowColor: '#ffffff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 15,
            }}
          >
            {/* The unique spin: A constantly rotating gradient border */}
            <Animated.View style={[spinStyle, { position: 'absolute', inset: -2, borderRadius: 26, overflow: 'hidden' }]}>
              <LinearGradient
                colors={['rgba(255,255,255,1)', 'rgba(0,0,0,0.2)', 'rgba(255,255,255,0.5)', 'rgba(0,0,0,0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
            <View className="absolute inset-0 m-[2px] bg-[#111] rounded-[1.4rem] items-center justify-center">
              <Plus size={32} color="#fff" strokeWidth={1.5} />
            </View>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

function TabItem({ isFocused, route, navigation, Icon, label }: any) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(isFocused ? 1.15 : 1, { damping: 15, stiffness: 300 }) }
      ],
    };
  }, [isFocused]);

  const onPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={animatedStyle}
      className="items-center justify-center p-3"
      hitSlop={10}
    >
      <Icon
        size={24}
        color={isFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'}
        strokeWidth={isFocused ? 2 : 1.5}
      />
    </AnimatedPressable>
  );
}
