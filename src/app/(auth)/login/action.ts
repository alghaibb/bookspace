"use server";

import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { loginSchema, LoginValues } from "@/lib/validations";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Duration } from "@/lib/duration";

// Initialize Upstash Redis client
const redis = Redis.fromEnv();

// Function to create rate limiters with specific limits and durations
const createRateLimit = (limit: number, window: Duration) => {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
  });
};

// Login action function
export async function loginAction(credentials: LoginValues): Promise<{ error?: string }> {
  try {
    // Validate login credentials using the provided schema
    const { email, password } = loginSchema.parse(credentials);

    // Define rate limiter with limit of 5 attempts per 15 minutes
    const rateLimit = createRateLimit(5, "15m");
    // Check rate limit for the specific email key
    const { success, remaining, reset } = await rateLimit.limit(`login:${email}`);

    // If rate limit exceeded, return error with remaining wait time
    if (!success) {
      const resetMinutes = reset ? Math.ceil((reset - Date.now()) / 1000 / 60) : 15;
      return { error: `Too many login attempts. Please try again in ${resetMinutes} minutes` };
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

    // If user not found or password is not set, increment rate limit and return error
    if (!user || !user.password) {
      return { error: `Invalid email or password. You have ${remaining ?? 0} attempts left` };
    }

    // Verify the provided password against the stored password hash
    const validPassword = await verify(user.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // If password verification fails, increment rate limit and return error
    if (!validPassword) {
      return { error: "Invalid email or password" };
    }

    // Check if the user's email is verified
    if (!user.emailVerified) {
      return { error: "Please verify your email before logging in" };
    }

    // Reset lockout and failed attempts if login is successful
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lockoutUntil: null,
        loginAttempts: 0,
        lockoutReason: null,
      }
    });

    // Create a new session for the user
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set session cookie in response
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );

    // Redirect user to the homepage after successful login
    redirect("/");

  } catch (error) {
    // Handle redirect errors and return appropriate error messages
    if (isRedirectError(error)) throw error;
    return { error: (error as Error).message };
  }
}
