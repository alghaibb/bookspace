import { Metadata } from "next";
import Image from "next/image";
import VerifyEmailForm from "./VerifyEmailForm";
import verifyEmailImage from "@/assets/verify-email-image.jpg";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default function VerifyEmaiPage() {
  return (
    <div className="flex h-full max-h-[30rem] md:max-h-[40rem] w-full max-w-[64rem] rounded-2xl overflow-hidden bg-card shadow-2xl">
      <div className="w-full p-10 space-y-10 overflow-y-auto md:w-1/2">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold">Verify Your Email</h1>
          <p className="text-muted-foreground">
            We have sent you an email with an OTP to verify your email address.
          </p>
        </div>
        <div className="space-y-5">
          <VerifyEmailForm />
        </div>
      </div>
      <Image
        src={verifyEmailImage}
        alt=""
        className="hidden object-cover w-1/2 md:block"
      />
    </div>
  );
}
