"use server";

import prisma from "@/lib/prisma";
import { registerSchema, RegisterValues } from "@/lib/validations";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { generateEmailVerificationToken } from "@/utils/token";
import { sendVerificationEmail } from "@/utils/sendEmails";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/upstash";

const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "30m"),
});

export async function registerAction(credentials: RegisterValues): Promise<{ error?: string }> {
  try {
    const { username, email, password } = registerSchema.parse(credentials);
    const ip = headers().get("x-forwarded-for") || "unknown";

    // Determine rate limit key
    const rateLimitKey = `register:${email}:${ip}`;
    const { success, reset } = await rateLimit.limit(rateLimitKey);

    // If rate limit exceeded, return error with remaining wait time
    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 30;
      return { error: `Too many registration attempts. Please try again in ${resetMinutes} minutes.` };
    }

    // Hash the password
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
          mode: "insensitive",
        },
      },
    });

    if (usernameExists) {
      return {
        error: "Username already taken",
      };
    }

    // Check if email already exists
    const emailExists = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (emailExists) {
      return {
        error: "Email already taken",
      };
    }

    // Create the new user in the database
    await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: username,
        email,
        password: passwordHash,
        emailVerified: false,
      },
    });

    const verificationOTP = await generateEmailVerificationToken(email, userId);
    await sendVerificationEmail(email, verificationOTP);

    return redirect("/verify-email");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error(error);
    return { error: (error as Error).message };
  }
}
