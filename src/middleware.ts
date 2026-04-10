import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip");
  return ip || "unknown";
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

const rateLimitedRoutes = ["/api/auth/signup", "/api/auth/callback"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (!rateLimitedRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  const key = getClientKey(request);

  if (isRateLimited(key)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/signup/:path*", "/api/auth/callback/:path*"],
};