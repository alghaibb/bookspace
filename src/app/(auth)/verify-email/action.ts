"use server";

import prisma from "@/lib/prisma";
import { EmailVerificationValues, emailVerificationSchema } from "@/lib/validations";

export async function verifyEmailAction(credentials: EmailVerificationValues): Promise<{ error: string }> {
  try {
    const { email, otp } = emailVerificationSchema.parse(credentials);

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

    // Delete verification entry
    await prisma.emailVerification.delete({
      where: { id: verificationEntry.id }
    });

    return { error: "" };

  } catch (error) {
    return {
      error: (error as Error).message
    }
  }
}