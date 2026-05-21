import { NextResponse, type NextRequest } from "next/server";
import { getLimiter } from "@/lib/rate-limit";

export const config = {
  matcher: ["/api/:path*"],
};

export async function proxy(req: NextRequest) {
  // Internal cron route is gated by CRON_SECRET, not the per-IP limiter.
  if (req.nextUrl.pathname.startsWith("/api/internal/")) {
    return NextResponse.next();
  }

  const limiter = getLimiter();
  if (!limiter) return NextResponse.next();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anon";

  const { success, limit, remaining, reset } = await limiter.limit(ip);
  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
        "Retry-After": String(Math.max(1, Math.ceil((reset - Date.now()) / 1000))),
      },
    });
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(limit));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  return res;
}
