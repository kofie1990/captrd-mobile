import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Paystack sends a POST request with the signature in the 'x-paystack-signature' header
    if (req.method !== 'POST') {
      return new Response("Method not allowed", { status: 405 });
    }

    if (!PAYSTACK_SECRET_KEY) {
      console.warn("PAYSTACK_SECRET_KEY is not set in environment variables!");
      return new Response(JSON.stringify({ error: "Server Configuration Error" }), { status: 500 });
    }

    // Get the raw body as text for verification
    const bodyText = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    // Verify the Paystack signature
    const hash = createHmac('sha512', PAYSTACK_SECRET_KEY).update(bodyText).digest('hex');
    
    if (hash !== signature) {
      console.error("Paystack signature verification failed.");
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid Signature" }), { status: 401 });
    }

    // Parse the payload
    const payload = JSON.parse(bodyText);
    const event = payload.event;
    const data = payload.data;

    console.log(`Received Paystack Webhook: ${event} for reference: ${data.reference}`);

    // We care about successful charges
    if (event === 'charge.success') {
      const reference = data.reference;

      // Update the order in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('paystack_reference', reference);

      if (error) {
        console.error(`Error updating order for reference ${reference}:`, error);
        throw error;
      }

      console.log(`Successfully updated order with reference ${reference} to paid.`);
    } else {
      console.log(`Ignoring event: ${event}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

  } catch (error: any) {
    console.error("Paystack Webhook Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
