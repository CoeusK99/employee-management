import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Edge-safe config used by middleware: no Prisma/bcrypt imports here, since
 * Edge Middleware can't load Node built-ins that Prisma's driver adapter needs.
 * `authorize` is a stub — middleware only ever decodes an existing JWT, it
 * never signs in, so this is never invoked there. The real DB-backed
 * `authorize` lives in lib/auth.ts (Node runtime).
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.role = (token.role as NonNullable<typeof session.user.role>) ?? null;
      session.user.employeeId = (token.employeeId as string | null | undefined) ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
