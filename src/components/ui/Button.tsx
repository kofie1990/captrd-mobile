import React from 'react';
import { Pressable, Text, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { cn } from '@/lib/utils';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'outline' | 'glass';
  className?: string;
  labelClassName?: string;
}

export function Button({ label, variant = 'primary', className, labelClassName, onPress, onPressIn, onPressOut, ...props }: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.(e);
  };

  const variants = {
    primary: 'bg-white',
    outline: 'border border-white/20 bg-transparent',
    glass: 'glass',
  };

  const textVariants = {
    primary: 'text-black font-bold',
    outline: 'text-white',
    glass: 'text-white',
  };

  return (
    <Animated.View style={animatedStyle} className={className}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        className={cn(
          'w-full py-4 rounded-xl items-center justify-center flex-row',
          variants[variant]
        )}
        {...props}
      >
        <Text className={cn('text-lg font-sans', textVariants[variant], labelClassName)}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
