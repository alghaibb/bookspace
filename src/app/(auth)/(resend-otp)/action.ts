"use server";

import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/utils/sendEmails";
import { generateEmailVerificationToken, deleteEmailVerificationToken } from "@/utils/token";
import { ResendOTPValues, resendOTPSchema } from "@/lib/validations";

export async function resendOTPAction(credentials: ResendOTPValues): Promise<{ error?: string, success?: string }> {
  try {
    const { email } = resendOTPSchema.parse(credentials);

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    // If user not found, respond with success message to avoid exposing user existence
    if (!user) {
      return { success: "If you have an account with us, you will receive an OTP." };
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return { error: "Email has already been verified." };
    }

    // Check if there's an existing OTP that is not expired
    const existingOtp = await prisma.emailVerification.findFirst({
      where: {
        email,
        userId: user.id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // If OTP was created within the last minute, return an error
    if (existingOtp) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (existingOtp.createdAt > oneMinuteAgo) {
        return { error: "You can only request a new OTP once every minute." };
      }
    }

    // Delete existing OTPs for this user
    await deleteEmailVerificationToken(email, user.id);

    // Generate new OTP and send verification email
    const verificationOTP = await generateEmailVerificationToken(email, user.id);
    await sendVerificationEmail(email, verificationOTP);

    return { success: "If you have an account with us, you will receive an OTP." };
  } catch (error) {
    console.error("Error in resendOTPAction: ", error);
    return { error: "Something went wrong. Please try again." };
  }
}
