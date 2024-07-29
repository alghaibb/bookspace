"use server";

import prisma from "@/lib/prisma";
import { forgotPasswordSchema, ForgotPasswordValues } from "@/lib/validations";
import { generatePasswordResetToken } from "@/utils/token";
import { sendPasswordResetEmail } from "@/utils/sendEmails";
import { checkRateLimit } from "@/utils/rateLimit";
import { headers } from "next/headers";

export async function forgotPasswordAction(credentials: ForgotPasswordValues): Promise<{ error?: string, success?: string }> {
  try {
    const { email } = forgotPasswordSchema.parse(credentials);

    // Get IP address
    const ip = headers().get("x-forwarded-for");

    // Check rate limit
    const isAllowed = await checkRateLimit(`forgotPassword:${ip}`, 5, "1h");
    if (!isAllowed) {
      return { error: "You can only request a password reset 5 times per hour." };
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
      return {
        success: "If an account with that email exists, a password reset email will be sent."
      };
    }

    // Generate password reset token
    const resetToken = await generatePasswordResetToken(email, user.id);

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    return { success: "If an account with that email exists, a password reset email will be sent." };

  } catch (error) {
    console.error(error);
    return {
      error: "An error occurred while processing your request."
    };
  }
}
