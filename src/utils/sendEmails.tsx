import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { VerifyEmail, ForgotPasswordEmail } from "@/components/emails";
import { render } from "@react-email/components"; // Add this to render the email

const resend = new Resend(process.env.RESEND_API_KEY);

// Send verification email
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

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
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
      <ForgotPasswordEmail resetToken={resetToken} username={user.username} />
    );

    await resend.emails.send({
      from: "noreply@codewithmj.com",
      to: email,
      subject: "Reset your password",
      html: emailHtml,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
