import Image from "next/image";
import Link from "next/link";
import notFoundImage from "@/assets/not-found-image.jpg";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-100 p-4">
      <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-lg p-8 text-center">
        <Image
          src={notFoundImage}
          alt=""
          width={400}
          height={300}
          className="mb-4"
          priority
        />
        <h1 className="text-4xl font-bold text-zinc-800 mb-2">
          Page Not Found
        </h1>
        <p className="text-zinc-600 mb-4">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <Link href="/">
          <Button>Go back to home</Button>
        </Link>
      </div>
    </div>
  );
}
