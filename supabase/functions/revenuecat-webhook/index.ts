import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REVENUECAT_WEBHOOK_SECRET = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // 1. Verify Authorization Header
    const authHeader = req.headers.get("Authorization");
    if (!REVENUECAT_WEBHOOK_SECRET) {
      console.warn("REVENUECAT_WEBHOOK_SECRET is not set in environment variables!");
    } else if (authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse RevenueCat Payload
    const payload = await req.json();
    
    // Webhook test events don't have an event object sometimes, or might be empty
    if (!payload || !payload.event) {
      return new Response(JSON.stringify({ success: true, message: "No event data" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { type, app_user_id, entitlement_ids } = payload.event;
    console.log(`Received RevenueCat event: ${type} for user: ${app_user_id}`);

    // We only care about events that affect the 'studio_access' entitlement
    const affectsStudio = entitlement_ids?.includes("studio_access");
    
    if (!affectsStudio && (type === 'INITIAL_PURCHASE' || type === 'RENEWAL' || type === 'EXPIRATION')) {
      console.log("Event does not affect studio_access entitlement. Ignoring.");
      return new Response(JSON.stringify({ success: true, message: "Ignored (not studio_access)" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Determine if we should grant or revoke access
    let newStatus: boolean | null = null;

    switch (type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
      case "NON_RENEWING_PURCHASE":
        newStatus = true;
        break;
      case "EXPIRATION":
        newStatus = false;
        break;
      case "CANCELLATION":
        // Cancellation means they turned off auto-renew. 
        // They STILL HAVE ACCESS until the period ends (which triggers an EXPIRATION event).
        // So we don't revoke access here.
        console.log(`User ${app_user_id} cancelled auto-renew. Access remains until expiration.`);
        break;
      default:
        console.log(`Unhandled event type: ${type}`);
    }

    // 4. Update the user's profile in Supabase
    if (newStatus !== null && app_user_id) {
      console.log(`Updating user ${app_user_id} is_studio_subscriber to ${newStatus}`);
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_studio_subscriber: newStatus })
        .eq('id', app_user_id);

      if (error) {
        throw error;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("RevenueCat Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
