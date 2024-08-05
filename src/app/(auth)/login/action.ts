"use server";

import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { loginSchema, LoginValues } from "@/lib/validations";
import { verify } from "@node-rs/argon2";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/upstash";

const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15m"),
});

export async function loginAction(credentials: LoginValues): Promise<{ error?: string }> {
  try {
    const { email, password } = loginSchema.parse(credentials);
    const ip = headers().get("x-forwarded-for") || headers().get("unknown");

    // Check if user exists by email
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    // If user not found or password is not set, return error
    if (!user || !user.password) {
      return { error: "Invalid email or password." };
    }

    // Check if the user is locked out
    const currentTime = new Date();
    if (user.lockoutUntil && user.lockoutUntil > currentTime) {
      const remainingLockoutMinutes = Math.ceil((user.lockoutUntil.getTime() - currentTime.getTime()) / 1000 / 60);
      return { error: `Account is locked. Please try again in ${remainingLockoutMinutes} minutes.` };
    }

    // Reset login attempts if the lockout period has expired
    if (user.lockoutUntil && user.lockoutUntil <= currentTime) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lockoutUntil: null,
          loginAttempts: 0,
          lockoutReason: null,
        },
      });
    }

    // Determine rate limit key
    const rateLimitKey = `login:${email}:${ip}`;
    const { success, remaining, reset } = await rateLimit.limit(rateLimitKey);

    // If rate limit exceeded, return error with remaining wait time
    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 15;
      return { error: `Too many login attempts. Please try again in ${resetMinutes} minutes.` };
    }

    // Verify the provided password against the stored password hash
    const validPassword = await verify(user.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // If password verification fails, update login attempts and return error
    if (!validPassword) {
      const newAttempts = user.loginAttempts + 1;
      const lockoutData =
        newAttempts >= 5
          ? {
            lockoutUntil: new Date(Date.now() + 15 * 60 * 1000), // Lockout for 15 minutes
            lockoutReason: "Too many failed login attempts",
          }
          : {};

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          ...lockoutData,
        },
      });

      return { error: `Invalid email or password. You have ${remaining ?? 0} attempts left.` };
    }

    // Check if the user's email is verified
    if (!user.emailVerified) {
      return { error: "Please verify your email before logging in." };
    }

    // Reset lockout and failed attempts if login is successful
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lockoutUntil: null,
        loginAttempts: 0,
        lockoutReason: null,
      },
    });

    // Create a new session for the user
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set session cookie in response
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    // Redirect user to the homepage after successful login
    redirect("/");
  } catch (error) {
    // Handle redirect errors and return appropriate error messages
    if (isRedirectError(error)) throw error;
    return { error: (error as Error).message };
  }
}
