"use server";

import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { loginSchema, LoginValues } from "@/lib/validations";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { checkRateLimit, incrementRateLimit } from "@/utils/rateLimit";

export async function loginAction(credentials: LoginValues): Promise<{ error?: string }> {
  try {
    const { email, password } = loginSchema.parse(credentials);

    // Rate limit based on email
    const isAllowed = await checkRateLimit(`login:${email}`, 5, "15m");
    if (!isAllowed) {
      return { error: "Too many login attempts. Please try again in 15 minutes." };
    }

    // Check if user exists by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive"
        }
      }
    });

    if (!user || !user.password) {
      await incrementRateLimit(`login:${email}`, 5, "15m");
      return { error: "Invalid email or password" };
    }

    // Verify password
    const validPassword = await verify(user.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      await incrementRateLimit(`login:${email}`, 5, "15m");
      return { error: "Invalid email or password" };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      await incrementRateLimit(`login:${email}`, 5, "15m");
      return { error: "Please verify your email before logging in" };
    }

    // Reset lockout and failed attempts if successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lockoutUntil: null,
        loginAttempts: 0,
        lockoutReason: null,
      }
    });

    // Create session for the user
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    redirect("/");

  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: (error as Error).message };
  }
}
