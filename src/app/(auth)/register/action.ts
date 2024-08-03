"use server";

import prisma from "@/lib/prisma";
import { registerSchema, RegisterValues } from "@/lib/validations";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { generateEmailVerificationToken } from "@/utils/token";
import { sendVerificationEmail } from "@/utils/sendEmails";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
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

// Register action function
export async function registerAction(credentials: RegisterValues): Promise<{ error: string }> {
  try {
    // Validate registration credentials using the provided schema
    const { username, email, password } = registerSchema.parse(credentials);

    // Define rate limiter with limit of 5 attempts per 30 minutes
    const rateLimit = createRateLimit(5, "30m");
    // Check rate limit for the specific email key
    const { success, reset } = await rateLimit.limit(`register:${email}`);

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
          mode: "insensitive"
        }
      }
    });

    // If username exists, return error
    if (usernameExists) {
      return {
        error: "Username already taken"
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

    // If email exists, return error
    if (emailExists) {
      return {
        error: "Email already taken"
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
        lockoutReason: null,
        lockoutUntil: null,
        loginAttempts: 0,
      }
    });

    // Reset the rate limit for this email
    await redis.del(`register:${email}`);

    // Generate email verification OTP and send the email
    const verificationOTP = await generateEmailVerificationToken(email, userId);
    await sendVerificationEmail(email, verificationOTP);

    // Redirect to email verification page
    return redirect("/verify-email");

  } catch (error) {
    // Handle redirect errors and return appropriate error messages
    if (isRedirectError(error)) throw error;
    console.error(error);
    return {
      error: (error as Error).message
    };
  }
}
