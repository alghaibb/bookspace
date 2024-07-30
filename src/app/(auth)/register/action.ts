"use server";

import prisma from "@/lib/prisma";
import { registerSchema, RegisterValues } from "@/lib/validations";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { generateEmailVerificationToken } from "@/utils/token";
import { sendVerificationEmail } from "@/utils/sendEmails";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { checkRateLimit, incrementRateLimit } from "@/utils/rateLimit";
import { headers } from "next/headers";

export async function registerAction(credentials: RegisterValues): Promise<{ error: string }> {
  try {
    const { username, email, password } = registerSchema.parse(credentials);

    // Get IP address
    const ip = headers().get("x-forwarded-for") || "unknown-ip";

    // Rate limit
    const isAllowed = await checkRateLimit(`register:${ip}`, 5, "30m");
    if (!isAllowed) {
      return { error: "Too many registration attempts. Please try again later." };
    }

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    // Check if username already exists
    const usernameExists = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive"
        }
      }
    });

    if (usernameExists) {
      return {
        error: "Username/email already taken"
      };
    }

    // Check if email already exists
    const emailExists = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive"
        }
      }
    });

    if (emailExists) {
      return {
        error: "Username/email already taken"
      };
    }

    await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: username,
        email,
        password: passwordHash,
        emailVerified: false,
      }
    });

    const verificationOTP = await generateEmailVerificationToken(email, userId);
    await sendVerificationEmail(email, verificationOTP);

    return redirect("/verify-email");

  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: (error as Error).message
    };
  }
}
