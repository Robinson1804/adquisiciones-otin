/**
 * Next.js Edge Middleware — protects the (dashboard) route group.
 *
 * Strategy (design §5 — middleware decision):
 *  Edge middleware cannot access localStorage; it reads the `auth_token`
 *  cookie written by authStore.login(). Only PRESENCE is checked here —
 *  signature validation happens on the backend for every API call.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
