"use server";

import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/utils/sendEmails";
import { generateEmailVerificationToken, deleteEmailVerificationToken } from "@/utils/token";
import { ResendOTPValues, resendOTPSchema } from "@/lib/validations";
import { checkRateLimit } from "@/utils/rateLimit";
import { headers } from "next/headers";


export async function resendOTPAction(credentials: ResendOTPValues): Promise<{ error?: string, success?: string }> {

  try {
    const { email } = resendOTPSchema.parse(credentials);

    // Get IP address
    const ip = headers().get("x-forwarded-for")

    // Rate limit
    const isAllowed = await checkRateLimit(`login:${ip},`, 5, "1h");
    if (!isAllowed) {
      return { error: "You can only request an OTP 5 times per hour." };
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive"
        }
      }
    });

    if (!user) {
      return { success: "If you have an account with us, you will receive an OTP." };
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return { error: "Email has already been verified." };
    }

    // Check if there is an existing OTP that is not expired
    const existingOtp = await prisma.emailVerification.findFirst({
      where: {
        email,
        userId: user.id,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingOtp) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (existingOtp.createdAt > oneMinuteAgo) {
        return { error: "You can only request a new OTP once every minute." };
      }
    }

    // Delete any existing OTPs for this user
    await deleteEmailVerificationToken(email, user.id);

    // Generate new OTP
    const verificationOTP = await generateEmailVerificationToken(email, user.id);

    // Send verification email
    await sendVerificationEmail(email, verificationOTP);

    return { success: "If you have an account with us, you will receive an OTP." };

  } catch (error) {
    console.error("Error in resendOTPAction: ", error);
    return { error: "Something went wrong. Please try again." };
  }
}
