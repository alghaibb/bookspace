"use server";

import prisma from "@/lib/prisma";
import { verifyEmailSchema, VerifyEmailValues } from "@/lib/validations";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { deleteEmailVerificationToken } from "@/utils/token";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/upstash";

// Initialize rate limiter
const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1m"),
});

export async function verifyEmailAction(credentials: VerifyEmailValues): Promise<{ error?: string }> {
  try {
    const { email, otp } = verifyEmailSchema.parse(credentials);
    const ip = headers().get("x-forwarded-for") || "unknown";

    // Rate limit check
    const rateLimitKey = `verifyEmail:${email}:${ip}`;
    const { success, reset } = await rateLimit.limit(rateLimitKey);

    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 1;
      return { error: `Too many incorrect attempts. Please try again in ${resetMinutes} minutes.` };
    }

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      return { error: "Invalid email or invalid OTP" };
    }

    const verificationEntry = await prisma.emailVerification.findFirst({
      where: {
        email,
        otp,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationEntry) {
      return { error: "Invalid email or invalid OTP" };
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Delete verification entry
    await deleteEmailVerificationToken(email, user.id);

    // Redirect to login page after successful verification
    return redirect("/login");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      error: (error as Error).message,
    };
  }
}