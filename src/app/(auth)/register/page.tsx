import Image from "next/image";
import Link from "next/link";

import { Metadata } from "next";
import { Button } from "@/components/ui/button";

import registerImage from "@/assets/signup-image.jpg";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] rounded-2xl overflow-hidden bg-card shadow-2xl">
      <div className="w-full p-10 space-y-10 overflow-y-auto md:w-1/2">
        <div className="space-y-1 text-center">
          <h1 className="text-3xl font-bold">Register with BookSpace</h1>
          <p className="text-muted-foreground">
            A <span className="italic">space</span> to find a friend.
          </p>
        </div>
        <div className="space-y-5">
          <Link href="/login" className="block text-center">
            <Button variant="link">Already have an account? Login</Button>
          </Link>
        </div>
      </div>
      <Image
        src={registerImage}
        alt=""
        className="hidden object-cover w-1/2 md:block"
      />
    </div>
  );
}
