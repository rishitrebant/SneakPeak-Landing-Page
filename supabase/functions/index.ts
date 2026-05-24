import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = "SneakPeak <hello@sneakpeak.co.in>";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    const { email, position } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const positionText = position ? `#${position}` : "Early";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're on the SneakPeak waitlist</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:48px 24px;">
    <tr>
      <td>
        <!-- Logo -->
        <p style="font-size:22px;font-weight:800;letter-spacing:3px;color:#ffffff;margin:0 0 40px">
          SNEAK<span style="color:#b8ff00">PEAK</span>
        </p>

        <!-- Divider -->
        <div style="width:32px;height:2px;background:#b8ff00;margin-bottom:32px;"></div>

        <!-- Headline -->
        <h1 style="font-size:32px;font-weight:800;color:#ffffff;margin:0 0 8px;line-height:1.1;">
          You're ${positionText}<br/>on the list.
        </h1>

        <p style="font-size:14px;color:#888;margin:16px 0 32px;line-height:1.6;">
          Welcome to SneakPeak — India's first sneaker price comparison engine.
          We're building something that will save every sneakerhead in India
          real money, every time they buy.
        </p>

        <!-- What you get -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #222;border-radius:8px;padding:24px;margin-bottom:32px;">
          <tr><td>
            <p style="font-size:9px;letter-spacing:3px;color:#555;text-transform:uppercase;margin:0 0 16px;">AS A FOUNDING MEMBER, YOU GET</p>
            <p style="color:#ffffff;font-size:13px;margin:0 0 10px;">✦ &nbsp;Lifetime free price alerts</p>
            <p style="color:#ffffff;font-size:13px;margin:0 0 10px;">✦ &nbsp;Founding member badge on your profile</p>
            <p style="color:#ffffff;font-size:13px;margin:0;">✦ &nbsp;Direct input on what we build next</p>
          </td></tr>
        </table>

        <!-- What happens next -->
        <p style="font-size:9px;letter-spacing:3px;color:#555;text-transform:uppercase;margin:0 0 12px;">WHAT HAPPENS NEXT</p>
        <p style="color:#888;font-size:13px;line-height:1.6;margin:0 0 32px;">
          When we're ready to launch, you'll be among the first to get access —
          ahead of the general public. We'll reach out to this email address.
        </p>

        <!-- Divider -->
        <div style="height:1px;background:#1e1e1e;margin-bottom:28px;"></div>

        <!-- Footer -->
        <p style="font-size:11px;color:#444;margin:0;line-height:1.7;">
          SneakPeak &nbsp;&middot;&nbsp; sneakpeak.co.in<br/>
          Built for India's sneaker community.<br/>
          <span style="color:#333;">If you didn't sign up, you can safely ignore this email.</span>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `You're ${positionText} on the SneakPeak waitlist`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ error: "Email send failed", detail: resendData }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: resendData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
