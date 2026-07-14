"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Role } from "@/app/generated/prisma/enums";

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "儀表板", roles: ["ADMIN", "MANAGER", "SALES_REP", "HR"] },
  { href: "/employees", label: "員工", roles: ["ADMIN", "MANAGER", "SALES_REP", "HR"] },
  { href: "/departments", label: "部門", roles: ["ADMIN", "HR"] },
  { href: "/sales", label: "銷售紀錄", roles: ["ADMIN", "MANAGER", "SALES_REP"] },
  { href: "/commission-rules", label: "獎金規則", roles: ["ADMIN"] },
  { href: "/commissions", label: "獎金結算", roles: ["ADMIN", "MANAGER", "SALES_REP"] },
  { href: "/reports", label: "報表", roles: ["ADMIN", "MANAGER", "SALES_REP"] },
  { href: "/password-resets", label: "密碼重設", roles: ["ADMIN"] },
];

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "管理員",
  MANAGER: "主管",
  SALES_REP: "業務員",
  HR: "人事",
};

export function AppShell({
  role,
  email,
  name,
  children,
}: {
  role: Role;
  email: string;
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <div className="flex flex-1">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/30 p-4 sm:flex sm:flex-col sm:gap-1">
        <div className="mb-4 px-2 text-lg font-semibold">員工管理系統</div>
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                active && "bg-accent text-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="text-sm text-muted-foreground">
            {name || email} · {ROLE_LABEL[role]}
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            登出
          </Button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
