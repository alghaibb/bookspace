import { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";
import Image from "next/image";
import forgotPasswordImage from "@/assets/forgot-password-image.jpg";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] rounded-2xl overflow-hidden bg-card shadow-2xl">
      <div className="w-full p-10 space-y-10 overflow-y-auto md:w-1/2">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold">Forgot Password</h1>
          <p className="text-muted-foreground">
            Enter your email to receive a password reset link.
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
      <Image
        src={forgotPasswordImage}
        alt="Image of someone frustrated for forgetting their password"
        className="hidden object-cover w-1/2 md:block"
      />
    </div>
  );
}
