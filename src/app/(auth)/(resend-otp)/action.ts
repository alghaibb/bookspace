"use server";

import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/utils/sendEmails";
import { generateEmailVerificationToken, deleteEmailVerificationToken } from "@/utils/token";
import { ResendOTPValues, resendOTPSchema } from "@/lib/validations";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/upstash";

const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10m"),
});

export async function resendOTPAction(credentials: ResendOTPValues): Promise<{ error?: string; success?: string }> {
  try {
    const { email } = resendOTPSchema.parse(credentials);
    const ip = headers().get("x-forwarded-for") || "unknown";

    // Determine rate limit key
    const rateLimitKey = `resendOTP:${email}:${ip}`;
    const { success, reset } = await rateLimit.limit(rateLimitKey);

    // If rate limit exceeded, return error with remaining wait time
    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 10;
      return { error: `Too many OTP requests. Please try again in ${resetMinutes} minutes.` };
    }

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return { success: "If you have an account with us, you will receive an OTP." };
    }

    if (user.emailVerified) {
      return { error: "Email has already been verified." };
    }

    const existingOtp = await prisma.emailVerification.findFirst({
      where: {
        email,
        userId: user.id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

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
