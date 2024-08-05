import Link from "next/link";
import logo from "@/assets/logo-no-background.svg";
import Image from "next/image";
import UserButton from "@/components/UserButton";
import SearchField from "@/components/SearchField";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 shadow-sm bg-card">
      <div className="flex flex-wrap items-center justify-center gap-5 p-5 px-5 py-3 mx-auto max-w-7xl">
        <Link href="/">
          <Image src={logo} alt="" width={250} height={250} className="p-3" />
        </Link>
        <SearchField />
        <UserButton className="sm:ms-auto"/>
      </div>
    </header>
  );
}
