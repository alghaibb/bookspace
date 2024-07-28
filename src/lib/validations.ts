import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
  username: z.string().min(3, { message: "Username must be at least 3 characters long" }).regex(/^[a-zA-Z0-9_-]+$/, { message: "Username can only contain letters, numbers, underscores, and hyphens" }).trim(),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }).trim(),
  confirmPassword: z.string().min(8, { message: "Confirm Password must be at least 8 characters long" }).trim(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }).trim(),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
  otp: z
    .string()
    .min(6, { message: "OTP must be exactly 6 characters long" })
    .max(6, { message: "OTP must be exactly 6 characters long" })
    .regex(/^\d+$/, { message: "OTP must contain only numbers" })
    .trim(),
});

export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;

export const resendOTPSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
});

export type ResendOTPValues = z.infer<typeof resendOTPSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }).trim(),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().trim(),
  newPassword: z.string().min(8, { message: "New Password must be at least 8 characters long" }).trim(),
  confirmNewPassword: z.string().min(8, { message: "Confirm New Password must be at least 8 characters long" }).trim(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;