import { getAuthUser, checkRouteAccess } from "@/lib/rbac";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/join",
  "/forgot-password",
  "/reset-password",
];
const authRoutes = ["/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow auth API routes
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow invitation routes (public)
  if (pathname.startsWith("/api/invitations")) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check session for protected routes
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check RBAC access
  const access = checkRouteAccess(pathname, user);

  if (!access.allowed) {
    return NextResponse.redirect(
      new URL(access.redirect || "/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
