import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_EMAIL = "kuofien@gmail.com";

serve(async (req) => {
  try {
    const payload = await req.json();
    
    if (payload.type === 'INSERT' && payload.table === 'reports') {
      const report = payload.record;

      if (!RESEND_API_KEY) {
        console.error("RESEND_API_KEY is not set");
        return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), { status: 500 });
      }

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Captrd Safety <support@captrd.live>",
          to: [SUPPORT_EMAIL],
          subject: `New Content Report: ${report.reason}`,
          html: `
            <h2>New Report Filed</h2>
            <p><strong>Reason:</strong> ${report.reason}</p>
            <p><strong>Details:</strong> ${report.details || 'None provided'}</p>
            <p><strong>Report ID:</strong> ${report.id}</p>
            <p><strong>Reporter ID:</strong> ${report.reporter_id}</p>
            <p><strong>Reported User ID:</strong> ${report.reported_user_id || 'N/A'}</p>
            <p><strong>Reported Photo ID:</strong> ${report.reported_photo_id || 'N/A'}</p>
            <br/>
            <p>Please review this report in the Supabase dashboard.</p>
          `,
        }),
      });

      if (!res.ok) {
        const errData = await res.text();
        console.error("Failed to send email via Resend", errData);
      } else {
        console.log("Email sent successfully");
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
