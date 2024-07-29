"use server";

import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { loginSchema, LoginValues } from "@/lib/validations";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";
import { checkRateLimit } from "@/utils/rateLimit";
import { headers } from "next/headers";

export async function loginAction(credentials: LoginValues): Promise<{ error?: string }> {
  try {
    const { email, password } = loginSchema.parse(credentials);

    // Get IP address
    const ip = headers().get("x-forwarded-for");

    // Rate limit
    const isAllowed = await checkRateLimit(`login:${ip}`, 5, "1h");
    if (!isAllowed) {
      return { error: "Too many login attempts. Please try again later." };
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
      return { error: "Invalid email or password" };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return { error: "Please verify your email before logging in" };
    }

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
