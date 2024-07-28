"use server";

import prisma from "@/lib/prisma";
import { verifyEmailSchema, VerifyEmailValues } from "@/lib/validations";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { deleteEmailVerificationToken } from "@/utils/token";

export async function verifyEmailAction(credentials: VerifyEmailValues): Promise<{ error: string }> {
  try {
    const { email, otp } = verifyEmailSchema.parse(credentials);

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
      return {
        error: "User not found"
      }
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
      return { error: "Invalid OTP or expired OTP" }
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
    }
  }
}