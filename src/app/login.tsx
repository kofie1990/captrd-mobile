import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setMessage('');

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        // Will be redirected by _layout.tsx
      } else {
        setMessage('Account created! You can now sign in.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        // Will be redirected by _layout.tsx
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black items-center justify-center relative px-6"
    >
      <StatusBar style="light" />

      {/* Immersive Background */}
      <View className="absolute inset-0 z-0 pointer-events-none">
        <Image
          source={require('../../assets/images/bg.jpg')}
          style={{ width: '100%', height: '100%', opacity: 0.2 }}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)', '#000000']}
          className="absolute inset-0"
        />
        <View className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square bg-white/5 rounded-full blur-3xl" />
        <View className="absolute bottom-[-20%] right-[-10%] w-[70%] aspect-square bg-white/10 rounded-full blur-3xl" />
      </View>

      <View className="w-full max-w-md p-8 bg-black/40 rounded-[3rem] border border-white/10 z-10 overflow-hidden shadow-2xl glass">
        <Text className="font-serif text-4xl text-white mb-2 text-center">
          {isSignUp ? "Join captrd" : "Login"}
        </Text>
        <Text className="text-center text-white/60 mb-10 font-mono uppercase tracking-widest text-[10px]">
          For Event Organizers
        </Text>

        <View className="gap-4">
          <TextInput
            placeholder="Email Address"
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-sans text-sm"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-sans text-sm"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Pressable
            disabled={loading}
            onPress={handleAuth}
            className={`mt-4 bg-white py-4 rounded-full active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black text-center font-bold uppercase tracking-widest text-xs font-mono">
                {isSignUp ? "Create Account" : "Enter Studio"}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsSignUp(!isSignUp);
            setMessage('');
          }}
          className="mt-8 py-2"
        >
          <Text className="text-[10px] text-white/50 text-center font-mono uppercase tracking-widest">
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </Text>
        </Pressable>

        {message ? (
          <Text className={`mt-6 text-center text-xs font-mono tracking-wide ${message.includes('created') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
