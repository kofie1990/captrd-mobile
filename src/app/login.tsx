import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, LogBox, Platform, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import Svg, { Path } from 'react-native-svg';

// Suppress known harmless warnings
LogBox.ignoreLogs([
  '[Reanimated]',
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

WebBrowser.maybeCompleteAuthSession();

// Use an HTTPS redirect URL on your own domain.
// Supabase won't match exp:// schemes, but it will always match HTTPS URLs.
// openAuthSessionAsync intercepts this URL BEFORE the browser navigates to it,
// so no page needs to exist at this path.
const REDIRECT_URL = 'https://captrd.live/auth/mobile-callback';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGoogleSignIn = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URL,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // openAuthSessionAsync will close the browser as soon as it detects
        // navigation to REDIRECT_URL, capturing the full URL with tokens
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          REDIRECT_URL
        );

        if (result.type === 'success' && result.url) {
          const { params, errorCode } = QueryParams.getQueryParams(result.url);

          if (errorCode) throw new Error(errorCode);

          if (params.access_token) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token || '',
            });
            if (sessionError) throw sessionError;
          }
        } else if (result.type === 'cancel' || result.type === 'dismiss') {
          setMessage('Sign in was cancelled.');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setMessage(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
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
          Join captrd
        </Text>
        <Text className="text-center text-white/60 mb-10 font-mono uppercase tracking-widest text-[10px]">
          For Event Organizers
        </Text>

        <View className="gap-4">
          <Pressable
            disabled={loading}
            onPress={handleGoogleSignIn}
            className={`mt-4 bg-white py-4 px-6 flex-row items-center justify-center rounded-full active:scale-[0.98] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)] ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <View className="mr-3">
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </Svg>
                </View>
                <Text className="text-black text-center font-bold tracking-wide text-sm">
                  Continue with Google
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {message ? (
          <Text className="mt-6 text-center text-xs font-mono tracking-wide text-red-400">
            {message}
          </Text>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

