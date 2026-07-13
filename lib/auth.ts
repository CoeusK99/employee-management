import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import type { Role } from "@/app/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { employee: true },
        });
        if (!user) return null;

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) return null;

        if (user.employee && user.employee.status !== "ACTIVE") return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          name: user.employee
            ? `${user.employee.firstName} ${user.employee.lastName}`
            : user.email,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: Role }).role;
        token.employeeId = (user as { employeeId: string | null }).employeeId;
        return token;
      }
      if (token.sub) {
        // Revalidate on every request so offboarded/role-changed users lose access promptly.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { employee: true },
        });
        if (!dbUser || (dbUser.employee && dbUser.employee.status !== "ACTIVE")) {
          delete token.role;
          delete token.employeeId;
          return token;
        }
        token.role = dbUser.role;
        token.employeeId = dbUser.employeeId;
      }
      return token;
    },
  },
});
