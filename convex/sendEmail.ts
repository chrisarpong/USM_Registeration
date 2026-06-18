import { action } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendWelcomeEmail = action({
  args: { 
      email: v.string(), 
      name: v.string(), 
      eventId: v.id("events"), 
      logId: v.id("attendanceLogs"),
      qrUuid: v.string()
  },
  handler: async (_, args) => {
    // @ts-ignore
    const apiKey = process.env.RESEND_API_KEY;
    // In production, we should get this from env vars, 
    // @ts-ignore
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        console.warn("RESEND_API_KEY is not set. Skipping email delivery.");
        return { success: false, error: "Missing API Key" };
    }

    const resend = new Resend(resendKey);

    // Generate a QR code URL for the ticket (using quickchart.io for speed)
    const qrData = encodeURIComponent(args.qrUuid);
    const qrImageUrl = `https://quickchart.io/qr?text=${qrData}&size=300&margin=1`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your USM Event Ticket</title>
      </head>
      <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background-color: #000000; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Unending Spirit Meeting</h1>
            <p style="color: #a1a1aa; margin: 10px 0 0 0; font-size: 16px;">Your Official Event Pass</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #18181b; margin: 0 0 20px 0; font-size: 22px;">Hi ${args.name},</h2>
            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
              Your registration has been successfully confirmed. We are absolutely thrilled to host you! Please have the QR code below ready to scan when you arrive at the venue for a fast and seamless check-in.
            </p>
            
            <!-- QR Code Section -->
            <div style="text-align: center; background-color: #fafafa; padding: 30px; border-radius: 12px; border: 1px solid #e4e4e7; margin-bottom: 30px;">
                <img src="${qrImageUrl}" alt="Your Ticket QR Code" style="width: 200px; height: 200px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);" />
                <p style="color: #71717a; font-size: 14px; font-weight: 600; margin: 20px 0 0 0; letter-spacing: 1px;">TICKET ID: ${args.qrUuid.split('-')[0].toUpperCase()}</p>
            </div>

            <!-- Event Highlights -->
            <div style="border-left: 4px solid #8b5cf6; padding-left: 20px; margin-bottom: 30px;">
              <p style="color: #27272a; font-size: 15px; font-weight: 500; margin: 0 0 8px 0;">Expect a powerful time of fellowship, worship, and the word.</p>
              <p style="color: #71717a; font-size: 14px; margin: 0;">Doors open early. We encourage you to arrive on time to secure a good seat.</p>
            </div>
            
            <!-- WhatsApp Call to action -->
            <div style="text-align: center;">
              <p style="color: #52525b; font-size: 15px; margin-bottom: 15px;">Want to invite a friend to join you?</p>
              <a href="https://wa.me/?text=Hey!%20I%20just%20registered%20for%20the%20Unending%20Spirit%20Meeting.%20Join%20me!%20%F0%9F%95%8A%E2%9C%A8%0A%0ARegister%20here:%20https://usm-registeration.vercel.app" style="display: inline-block; background-color: #25D366; color: white; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 15px;">Share on WhatsApp</a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #f4f4f5;">
            <p style="color: #a1a1aa; font-size: 13px; margin: 0;">© 2026 Unending Spirit Meeting. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: "USM Events <events@usm-registration.com>",
        to: args.email,
        subject: "Your Event Ticket & QR Code",
        html: htmlContent,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send email", error);
      return { success: false, error: "Email provider error" };
    }
  },
});
