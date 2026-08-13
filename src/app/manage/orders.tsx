import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Package, User, MapPin, Calendar, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { LoadingState } from '@/components/ui/LoadingState';

type Order = {
  id: string;
  user_id: string;
  event_id: string;
  format: string;
  finish: string;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_gps: string;
  shipping_email?: string;
  status: string;
  created_at: string;
  events: {
    title: string;
  };
};

export default function ManageOrdersScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session) return;
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          events(title)
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data as unknown as Order[]);
      } else if (error) {
        console.error("Error fetching orders:", error);
      }
      setLoading(false);
    };

    fetchOrders();
  }, [session]);

  if (loading) {
    return <LoadingState.Screen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <StatusBar style="light" />
      <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 }}>
        <Pressable 
          onPress={() => router.back()} 
          className="flex-row items-center gap-2 mb-8 opacity-60 active:opacity-100"
        >
          <ArrowLeft size={16} color="#fff" />
          <Text className="text-white font-mono text-xs uppercase tracking-widest">Back</Text>
        </Pressable>
        <Text className="font-serif text-4xl text-white mb-2">Orders</Text>
        <Text className="text-white/60 mb-6">Manage all incoming print requests.</Text>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
        {orders.length === 0 ? (
          <View className="py-16 items-center border border-dashed border-white/20 rounded-3xl">
            <Package size={48} color="rgba(255,255,255,0.2)" className="mb-4" />
            <Text className="text-white/50 italic font-serif text-xl">No orders found.</Text>
          </View>
        ) : (
          <View className="gap-4">
            {orders.map((order) => (
              <View key={order.id} className="bg-white/5 p-5 rounded-3xl border border-white/10">
                <View className="flex-row justify-between items-start mb-4">
                  <View>
                    <Text className="font-serif text-xl text-white">{order.events.title}</Text>
                    <Text className="text-white/60 font-mono text-xs mt-1">
                      {order.format.toUpperCase()} • {order.finish.toUpperCase()}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full border ${order.status === 'pending' ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-green-500/20 border-green-500/30'}`}>
                    <Text className={`font-mono text-[9px] uppercase tracking-widest ${order.status === 'pending' ? 'text-yellow-500' : 'text-green-500'}`}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <View className="bg-black/20 rounded-2xl p-4 gap-3">
                  <View className="flex-row items-center gap-3">
                    <User size={14} color="rgba(255,255,255,0.4)" />
                    <Text className="text-white/80 font-sans text-sm">{order.shipping_name}</Text>
                  </View>
                  {order.shipping_email ? (
                    <View className="flex-row items-center gap-3">
                      <Mail size={14} color="rgba(255,255,255,0.4)" />
                      <Text className="text-white/80 font-sans text-sm">{order.shipping_email}</Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center gap-3">
                    <MapPin size={14} color="rgba(255,255,255,0.4)" />
                    <Text className="text-white/80 font-sans text-sm flex-1">
                      {order.shipping_address}, {order.shipping_city}, {order.shipping_gps}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Calendar size={14} color="rgba(255,255,255,0.4)" />
                    <Text className="text-white/60 font-mono text-[10px]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
