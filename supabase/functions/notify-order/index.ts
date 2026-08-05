import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEVELOPER_EMAIL = "kuofien@gmail.com";

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // We only care about INSERT events on the orders table
    if (payload.type === 'INSERT' && payload.table === 'orders') {
      const order = payload.record;

      // 1. Find the developer's user_id from the push_tokens table directly
      // Alternatively, we could look up the developer's ID from auth.users, 
      // but to avoid needing auth.admin permissions, we can just look for the 
      // token associated with the developer if we store email, OR
      // simpler: just fetch ALL tokens in the push_tokens table since the developer
      // is the only one we really care about right now, OR use admin.listUsers
      
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;
      
      const developer = users.users.find((u: any) => u.email === DEVELOPER_EMAIL);
      
      if (developer) {
        // 2. Get the developer's push token
        const { data: tokenData, error: tokenError } = await supabase
          .from('push_tokens')
          .select('token')
          .eq('user_id', developer.id)
          .single();

        if (tokenData?.token) {
          // 3. Send push notification via Expo
          const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: tokenData.token,
              sound: 'default',
              title: 'New Print Order! 🎉',
              body: `An order for a ${order.format} was just placed.`,
              data: { orderId: order.id },
            }),
          });

          const expoResult = await expoResponse.json();
          console.log("Expo push result:", expoResult);
        } else {
          console.log("Developer push token not found");
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
