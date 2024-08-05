"use server";

import prisma from "@/lib/prisma";
import { lucia } from "@/auth";
import { loginSchema, LoginValues } from "@/lib/validations";
import { verify } from "@node-rs/argon2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function loginAction(credentials: LoginValues): Promise<{ error?: string }> {
  try {
    const { email, password } = loginSchema.parse(credentials);

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

    // Verify the provided password against the stored password hash
    const validPassword = await verify(user.password, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // If password verification fails, return error
    if (!validPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: user.loginAttempts + 1,
        },
      });

      if (user.loginAttempts + 1 >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lockoutUntil: new Date(Date.now() + 15 * 60 * 1000),
            lockoutReason: "Too many failed login attempts",
          },
        });
      }

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
