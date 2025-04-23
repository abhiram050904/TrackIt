import { Resend } from "resend";

interface EmailData {
  to: string;
  subject: string;
  react: any;
}

export async function sendEmail({ to, subject, react }: EmailData) {
  const resend = new Resend(process.env.RESEND_API_KEY || "");

  try {
    const data = await resend.emails.send({
      from: 'TrackIt <onboarding@resend.dev>',
      to:'karunasreegorrepati@gmail.com',
      subject,
      react,
    });

    console.log('message sent',data)

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
