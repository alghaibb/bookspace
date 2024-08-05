import { validateRequest } from "../../auth";
import { redirect } from "next/navigation";
import SessionProvider from "./SessionProvider";
import Header from "./Header";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await validateRequest();

  if (!session.user) redirect("/login");

  return (
    <SessionProvider value={session}>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="p-5 mx-auto max-w-7xl">{children}</div>
      </div>
    </SessionProvider>
  );
}
