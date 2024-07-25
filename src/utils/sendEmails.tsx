import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { VerifyEmail } from "@/components/emails";
import { render } from "@react-email/components"; // Add this to render the email

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (
  email: string,
  verificationOTP: string
) => {
  // Get user's username
  const user = await prisma.user.findFirst({
    where: { email },
    select: { username: true },
  });

  if (!user) {
    console.error("User not found for email:", email);
    return;
  }

  try {
    const emailHtml = render(
      <VerifyEmail verificationOTP={verificationOTP} username={user.username} />
    );

    console.log("Sending email to:", email);
    console.log("Email content:", emailHtml);

    await resend.emails.send({
      from: "noreply@codewithmj.com",
      to: email,
      subject: "Verify your email address",
      html: emailHtml,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
