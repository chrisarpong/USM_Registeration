import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";

const ResendOTP = Email({
  id: "resend-otp",
  // @ts-expect-error process is available in Convex runtime
  apiKey: process.env.RESEND_API_KEY,
  maxAge: 60 * 15, // 15 minutes
  async generateVerificationToken() {
    // Generate a secure 6-digit numeric string
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = (array[0] % 900000) + 100000;
    return code.toString();
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "USM Admin <onboarding@resend.dev>", // Note: Use verified domain in production
      to: [email],
      subject: "Your USM Admin sign-in code",
      text: `Your 6-digit sign-in code is: ${token}`,
    });

    if (error) {
      throw new Error("Could not send email. Please check your RESEND_API_KEY.");
    }
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP],
});
