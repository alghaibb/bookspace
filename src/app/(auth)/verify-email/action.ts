"use server";

import prisma from "@/lib/prisma";
import { verifyEmailSchema, VerifyEmailValues } from "@/lib/validations";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { deleteEmailVerificationToken } from "@/utils/token";

export async function verifyEmailAction(credentials: VerifyEmailValues): Promise<{ error?: string }> {
  try {
    const { email, otp } = verifyEmailSchema.parse(credentials);

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    // If user not found, return error
    if (!user) {
      return { error: "Invalid email or invalid OTP" };
    }

    // Check if OTP is valid and not expired
    const verificationEntry = await prisma.emailVerification.findFirst({
      where: {
        email,
        otp,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // If OTP is invalid or expired, return error
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