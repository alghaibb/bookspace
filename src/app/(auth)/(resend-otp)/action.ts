"use server";

import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/utils/sendEmails";
import { generateEmailVerificationToken, deleteEmailVerificationToken } from "@/utils/token";
import { ResendOTPValues, resendOTPSchema } from "@/lib/validations";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Duration } from "@/lib/duration";
// Initialize Upstash Redis client
const redis = Redis.fromEnv();

// Function to create rate limiters with specific limits and durations
const createRateLimit = (limit: number, window: Duration) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
  });
};

// Resend OTP action function
export async function resendOTPAction(credentials: ResendOTPValues): Promise<{ error?: string, success?: string }> {
  try {
    // Validate OTP resend credentials using the provided schema
    const { email } = resendOTPSchema.parse(credentials);

    // Define rate limiter with limit of 5 requests per 10 minutes
    const rateLimit = createRateLimit(5, "10m");
    // Check rate limit for the specific IP key
    const { success, reset } = await rateLimit.limit(`resendOTP:${email}`);

    // If rate limit exceeded, return error with remaining wait time
    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 10;
      return { error: `You can only request an OTP 5 times per 10 minutes. Please try again in ${resetMinutes} minutes.` };
    }

    // Check if user exists by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive"
        }
      }
    });

    // If user not found, respond with success message (to avoid exposing user existence)
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

    // If OTP was created within the last minute, return error
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
