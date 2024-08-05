"use server";

import prisma from "@/lib/prisma";
import { forgotPasswordSchema, ForgotPasswordValues } from "@/lib/validations";
import { generatePasswordResetToken } from "@/utils/token";
import { sendPasswordResetEmail } from "@/utils/sendEmails";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/upstash";

const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "30m"),
});

export async function forgotPasswordAction(credentials: ForgotPasswordValues): Promise<{ error?: string; success?: string }> {
  try {
    const { email } = forgotPasswordSchema.parse(credentials);
    const ip = headers().get("x-forwarded-for") || "unknown";

    // Determine rate limit key
    const rateLimitKey = `forgotPassword:${email}:${ip}`;
    const { success, reset } = await rateLimit.limit(rateLimitKey);

    // If rate limit exceeded, return error with remaining wait time
    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 30;
      return { error: `Too many password reset attempts. Please try again in ${resetMinutes} minutes.` };
    }

    // Check if user exists by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return {
        success: "If an account with that email exists, a password reset email will be sent.",
      };
    }

    const resetToken = await generatePasswordResetToken(email, user.id);
    await sendPasswordResetEmail(email, resetToken);

    return { success: "If an account with that email exists, a password reset email will be sent." };
  } catch (error) {
    console.error(error);
    return {
      error: "An error occurred while processing your request.",
    };
  }
}
