"use server";

import prisma from "@/lib/prisma";
import { forgotPasswordSchema, ForgotPasswordValues } from "@/lib/validations";
import { generatePasswordResetToken } from "@/utils/token";
import { sendPasswordResetEmail } from "@/utils/sendEmails";

export async function forgotPasswordAction(credentials: ForgotPasswordValues): Promise<{ error?: string, success?: string }> {
  try {
    const { email } = forgotPasswordSchema.parse(credentials);

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
