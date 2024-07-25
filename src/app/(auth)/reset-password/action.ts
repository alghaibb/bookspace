"use server";

import prisma from "@/lib/prisma";
import { resetPasswordSchema, ResetPasswordValues } from "@/lib/validations";
import { hash } from "@node-rs/argon2";
import { deletePasswordResetToken } from "@/utils/token";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";

export async function resetPasswordAction(credentials: ResetPasswordValues, token: string): Promise<{ error?: string }> {
  try {
    const { newPassword } = resetPasswordSchema.parse(credentials);

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

    return redirect("/login");

  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: (error as Error).message
    };
  }
}
