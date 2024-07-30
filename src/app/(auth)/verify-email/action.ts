"use server";

import prisma from "@/lib/prisma";
import { verifyEmailSchema, VerifyEmailValues } from "@/lib/validations";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { deleteEmailVerificationToken } from "@/utils/token";
import { checkRateLimit, incrementRateLimit } from "@/utils/rateLimit";
import { headers } from "next/headers";

export async function verifyEmailAction(credentials: VerifyEmailValues): Promise<{ error: string }> {
  try {
    const { email, otp } = verifyEmailSchema.parse(credentials);

    // Get IP address
    const ip = headers().get("x-forwarded-for") || "unknown-ip";

    // Check rate limit
    const isAllowed = await checkRateLimit(`verifyEmail:${ip}`, 5, "1m");
    if (!isAllowed) {
      return { error: "Too many incorrect attempts. Please try again in 1 minute." };
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
      await incrementRateLimit(`verifyEmail:${ip}`, 5, "1m"); // Increment on failed attempt
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

    if (!verificationEntry) {
      await incrementRateLimit(`verifyEmail:${ip}`, 5, "1m"); // Increment on failed attempt
      return { error: "Invalid email or invalid OTP" };
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true }
    });

    // Delete verification entry using utility function
    await deleteEmailVerificationToken(email, user.id);

    return redirect("/login");

  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      error: (error as Error).message
    };
  }
}
