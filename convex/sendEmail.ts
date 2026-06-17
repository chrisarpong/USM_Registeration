import { action } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendWelcomeEmail = action({
  args: { 
      email: v.string(), 
      name: v.string(), 
      eventId: v.id("events"), 
      logId: v.id("attendanceLogs") 
  },
  handler: async (ctx, args) => {
    // In production, we should get this from env vars, 
    // but for fast implementation with missing keys, we handle it safely
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
        console.warn("RESEND_API_KEY is not set. Skipping email delivery.");
        return { success: false, error: "Missing API Key" };
    }

    const resend = new Resend(resendKey);

    // Generate a QR code URL for the ticket (using quickchart.io for speed)
    const qrData = encodeURIComponent(args.logId);
    const qrImageUrl = `https://quickchart.io/qr?text=${qrData}&size=300&margin=1`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Welcome to USM, ${args.name}!</h2>
        <p style="color: #555; text-align: center; font-size: 16px;">
          You have successfully registered for the event. Please present the QR code below at the entrance for a fast check-in.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <img src="${qrImageUrl}" alt="Your Ticket QR Code" style="border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
        </div>
        <p style="color: #777; text-align: center; font-size: 14px;">
          Ticket ID: ${args.logId}
        </p>
      </div>
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
