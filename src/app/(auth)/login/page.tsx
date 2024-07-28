import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";
import { Button } from "@/components/ui/button";
import loginImage from "@/assets/login-image.jpg";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] rounded-2xl overflow-hidden bg-card shadow-2xl">
      <div className="w-full p-10 space-y-10 overflow-y-auto md:w-1/2">
        <h1 className="text-3xl font-bold text-center">Login to BookSpace</h1>
        <div className="space-y-5">
          <LoginForm />
          <Link href="/register" className="block text-center">
            <Button variant="link">
              Don&apos;t have an account? Register here
            </Button>
          </Link>
        </div>
      </div>
      <Image
        src={loginImage}
        alt=""
        className="hidden object-cover w-1/2 md:block"
      />
    </div>
  );
}
