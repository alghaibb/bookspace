import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().trim(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/).trim(),
  password: z.string().min(8).trim(),
  confirmPassword: z.string().min(8).trim(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().trim().optional(),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/).trim().optional(),
  password: z.string().min(8).trim(),
}).refine(data => data.email || data.username, {
  message: "Either email or username must be provided",
  path: ["email", "username"],
});

export type LoginValues = z.infer<typeof loginSchema>;

export const emailVerificationSchema = z.object({
  email: z.string().email().trim(),
  otp: z.string().min(6).max(6).trim(),
});

export type EmailVerificationValues = z.infer<typeof emailVerificationSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email().trim(),
  token: z.string().trim(),
  newPassword: z.string().min(8).trim(),
  confirmNewPassword: z.string().min(8).trim(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;