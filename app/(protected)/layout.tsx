import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.role) {
    redirect("/login");
  }

  return <AppShell role={session.user.role} email={session.user.email ?? ""} name={session.user.name ?? ""}>{children}</AppShell>;
}
