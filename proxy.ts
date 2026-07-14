import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const ADMIN_ONLY_PREFIXES = ["/commission-rules", "/password-resets"];
const PUBLIC_PATHS = ["/login", "/forgot-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth?.user?.role;

  if (PUBLIC_PATHS.includes(pathname)) {
    if (isAuthed) return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (!isAuthed) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (
    ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p)) &&
    req.auth?.user?.role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
