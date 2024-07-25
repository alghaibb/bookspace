"use server";

import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { loginSchema, LoginValues } from "@/lib/validations";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function loginAction(credentials: LoginValues): Promise<{ error: string }> {
  try {
    const { username, email, password } = loginSchema.parse(credentials);

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: {
              equals: email,
              mode: "insensitive"
            }
          },
          {
            username: {
              equals: username,
              mode: "insensitive"
            }
          }
        ]
      }
    });

    if (!user || !user.password) {
      return { error: "Invalid email/username or password" }
    }

    // Verify password
    const validPassword = await verify(user.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    if (!validPassword) {
      return { error: "Invalid email/username or password" }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return { error: "Please verify your email before logging in" }
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
    return {
      error: (error as Error).message
    }
  }
}