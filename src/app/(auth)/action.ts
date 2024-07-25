"use server";

import { lucia, validateRequest } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {

  // Validate the request
  const { session } = await validateRequest();

  // If session is not found, throw an error
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Invalidate the session
  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();

  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes
  )

  return redirect("/login");
}