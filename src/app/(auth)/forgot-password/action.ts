"use server";

import prisma from "@/lib/prisma";
import { forgotPasswordSchema, ForgotPasswordValues } from "@/lib/validations";
import { generatePasswordResetToken } from "@/utils/token";
import { sendPasswordResetEmail } from "@/utils/sendEmails";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Duration } from "@/lib/duration";
import { headers } from "next/headers";

// Initialize Upstash Redis client
const redis = Redis.fromEnv();

// Function to create rate limiters with specific limits and durations
const createRateLimit = (limit: number, window: Duration) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
  });
};

// Forgot password action function
export async function forgotPasswordAction(credentials: ForgotPasswordValues): Promise<{ error?: string, success?: string }> {
  try {
    // Validate forgot password credentials using the provided schema
    const { email } = forgotPasswordSchema.parse(credentials);

    // Get IP address from headers
    const ip = headers().get("x-forwarded-for") || "unknown-ip";

    // Define rate limiter with limit of 5 requests per 30 minutes
    const rateLimit = createRateLimit(5, "30m");
    // Check rate limit for the specific IP key
    const { success, reset } = await rateLimit.limit(`forgotPassword:${ip}`);

    // If rate limit exceeded, return error with remaining wait time
    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 30;
      return { error: `You can only request a password reset 5 times per 30 minutes. Please try again in ${resetMinutes} minutes.` };
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
      return {
        success: "If an account with that email exists, a password reset email will be sent."
      };
    }

    // Generate password reset token for the user
    const resetToken = await generatePasswordResetToken(email, user.id);

    // Send password reset email to the user
    await sendPasswordResetEmail(email, resetToken);

    return { success: "If an account with that email exists, a password reset email will be sent." };

  } catch (error) {
    console.error(error);
    return {
      error: "An error occurred while processing your request."
    };
  }
}
