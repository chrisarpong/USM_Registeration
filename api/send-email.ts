import { Resend } from 'resend';

export const config = {
    runtime: 'edge',
};

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { name, email } = await request.json() as { name: string, email: string };

        if (!email) {
            return new Response('Email is required', { status: 400 });
        }

        const { data, error } = await resend.emails.send({
            from: 'USM Registration <onboarding@resend.dev>', // Resend strictly blocks generic emails here
            replyTo: 'gospelwavescitadel19@gmail.com', // Replies safely route to church inbox
            to: [email],
            subject: 'Welcome to USM! 🎉',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="text-align: center; margin-bottom: 24px;">
                <img src="https://usm-registeration.vercel.app/USM.jpeg" alt="USM Flyer" style="width: 100%; max-width: 600px; height: auto; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.1);" />
            </div>
            <h1 style="color: #4f46e5; margin-top: 0;">You're Registered!</h1>
            <p>Hi ${name},</p>
            <p>We are thrilled to confirm your registration for the <strong>Unending Spirit Meeting (USM)</strong>.</p>
            
            <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> 28th March</p>
                <p style="margin: 5px 0;"><strong>⏰ Time:</strong> 10:00 AM</p>
                <p style="margin: 5px 0;"><strong>🏷️ Theme:</strong> Gift of Healing</p>
                <p style="margin: 5px 0;"><strong>📍 Location:</strong> 3rd floor ORA black star building, Opposite Ofankor Shell filling station</p>
            </div>

            <p>See you there!</p>
            <p>The USM Team</p>
        </div>
      `,
        });

        if (error) {
            console.error('Resend Error:', error);
            return new Response(JSON.stringify({ error }), { status: 500 });
        }

        return new Response(JSON.stringify({ data }), { status: 200 });
    } catch (error) {
        console.error('Server Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
