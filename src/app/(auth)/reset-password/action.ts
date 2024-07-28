"use server";

import prisma from "@/lib/prisma";
import { resetPasswordSchema, ResetPasswordValues } from "@/lib/validations";
import { hash } from "@node-rs/argon2";
import { deletePasswordResetToken } from "@/utils/token";

export async function resetPasswordAction(credentials: ResetPasswordValues): Promise<{ error?: string, success?: string }> {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(credentials);

    // Check if reset token is valid and not expired
    const resetEntry = await prisma.resetPassword.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetEntry) {
      return { error: "Invalid or expired reset token" };
    }

    // Hash new password
    const passwordHash = await hash(newPassword, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Update user's password
    await prisma.user.update({
      where: { id: resetEntry.userId },
      data: { password: passwordHash }
    });

    // Delete reset token entry
    await deletePasswordResetToken(resetEntry.email, resetEntry.userId);

    return { success: "Password reset successfully" }; 
  } catch (error) {
    console.error(error);
    return {
      error: "An error occurred while resetting your password. Please try again."
    };
  }
}
