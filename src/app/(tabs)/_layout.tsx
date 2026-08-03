import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/ui/TabBar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function TabLayout() {
  const { session } = useAuth();
  const [isStudioSubscriber, setIsStudioSubscriber] = useState<boolean | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('is_studio_subscriber')
          .eq('id', session.user.id)
          .single();
        
        setIsStudioSubscriber(!!data?.is_studio_subscriber);
      };
      fetchProfile();
    } else {
      setIsStudioSubscriber(false);
    }
  }, [session?.user?.id]);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard' }}
      />
      <Tabs.Screen
        name="studio"
        options={{ 
          title: 'Studio',
          href: isStudioSubscriber ? undefined : null
        }}
      />
      <Tabs.Screen
        name="order"
        options={{ title: 'Order Prints' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile' }}
      />
    </Tabs>
  );
}
