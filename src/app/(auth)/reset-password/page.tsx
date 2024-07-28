import { Metadata } from "next";
import ResetPasswordForm from "./ResetPasswordForm";
import Image from "next/image";
import resetPasswordImage from "@/assets/reset-password-image.jpg";

export const metadata: Metadata = {
  title: "Reset Password",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] rounded-2xl overflow-hidden bg-card shadow-2xl">
      <div className="w-full p-10 space-y-10 overflow-y-auto md:w-1/2">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your new password to reset your account password.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
      <Image
        src={resetPasswordImage}
        alt="Image of someone frustrated for forgetting their password"
        className="hidden object-cover w-1/2 md:block"
      />
    </div>
  );
}
