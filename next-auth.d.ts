import type { DefaultSession } from "next-auth";
import type { Role } from "@/app/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role | null;
      employeeId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    employeeId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    employeeId?: string | null;
  }
}
