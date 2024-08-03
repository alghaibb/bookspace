"use server";

import prisma from "@/lib/prisma";
import { verifyEmailSchema, VerifyEmailValues } from "@/lib/validations";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { deleteEmailVerificationToken } from "@/utils/token";
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

// Verify email action function
export async function verifyEmailAction(credentials: VerifyEmailValues): Promise<{ error: string }> {
  try {
    // Validate email verification credentials using the provided schema
    const { email, otp } = verifyEmailSchema.parse(credentials);

    // Define rate limiter with limit of 5 attempts per minute
    const rateLimit = createRateLimit(5, "1m");
    // Check rate limit for the specific IP key
    const { success, reset } = await rateLimit.limit(`verifyEmail:${email}`);

    // If rate limit exceeded, return error with remaining wait time
    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 1;
      return { error: `Too many incorrect attempts. Please try again in ${resetMinutes} minutes.` };
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

    // If user not found, increment rate limit and return error
    if (!user) {
      return { error: "Invalid email or invalid OTP" };
    }

    // Check if OTP is valid or not expired
    const verificationEntry = await prisma.emailVerification.findFirst({
      where: {
        email,
        otp,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    // If OTP is invalid or expired, increment rate limit and return error
    if (!verificationEntry) {
      return { error: "Invalid email or invalid OTP" };
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true }
    });

    // Delete verification entry using utility function
    await deleteEmailVerificationToken(email, user.id);

    // Redirect to login page
    return redirect("/login");

  } catch (error) {
    // Handle redirect errors and return appropriate error messages
    if (isRedirectError(error)) throw error;
    return {
      error: (error as Error).message
    };
  }
}
