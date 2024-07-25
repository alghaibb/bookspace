import prisma from "@/lib/prisma";
import crypto, { randomInt } from "crypto";

const generateNumericOTP = (): string => {
  const otp = randomInt(100000, 999999);
  return otp.toString();
}

// Generate verification OTP 
export const generateEmailVerificationToken = async (email: string, userId: string): Promise<string> => {
  const verificationOTP = generateNumericOTP();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  await prisma.emailVerification.create({
    data: {
      email,
      otp: verificationOTP,
      userId, // Ensure the userId is set
      expiresAt,
    },
  });

  return verificationOTP;
};


// Get verification OTP by email
export const getVerificationOTPByEmail = async (email: string, username: string) => {
  const emailVerification = await prisma.emailVerification.findFirst({
    where: {
      email,
      userId: username
    }
  });

  return emailVerification;
};

// Get verification OTP by email and OTP
export const getVerificationOTPByEmailAndOTP = async (email: string, username: string, otp: string) => {
  const emailVerification = await prisma.emailVerification.findFirst({
    where: {
      email,
      userId: username,
      otp
    }
  });

  return emailVerification;
};


// Delete verification OTP when user verifies their email
export const deleteEmailVerificationToken = async (email: string, username: string) => {
  await prisma.emailVerification.deleteMany({
    where: {
      email,
      userId: username
    }
  });
};

// Generate password reset token
export const generatePasswordResetToken = async (email: string, username: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  await prisma.resetPassword.create({
    data: {
      email,
      userId: username,
      token,
      expiresAt: expires
    }
  });

  return token;
};

// Get password reset token by email
export const getPasswordResetTokenByEmail = async (email: string, username: string) => {
  const resetPassword = await prisma.resetPassword.findFirst({
    where: {
      email,
      userId: username
    }
  });

  return resetPassword;
};

// Get password reset token by email and token
export const getPasswordResetTokenByEmailAndToken = async (email: string, username: string, token: string) => {
  const resetPassword = await prisma.resetPassword.findFirst({
    where: {
      email,
      userId: username,
      token
    }
  });

  return resetPassword;
};

// Delete password reset token
export const deletePasswordResetToken = async (email: string, username: string) => {
  await prisma.resetPassword.deleteMany({
    where: {
      email,
      userId: username
    }
  });
};
