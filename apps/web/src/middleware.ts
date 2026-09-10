import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that do NOT require authentication
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/logout",
];

// Public API endpoints that do NOT require authentication
const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/demo-login",
  "/api/auth/active-user",
  "/api/health",
  "/api/stats/presence",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow Next.js internals, static files, favicons, images
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/avatars") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp")
  ) {
    return NextResponse.next();
  }

  // Handle explicit /logout navigation: wipe cookies and send to /login
  if (pathname === "/logout") {
    const res = NextResponse.redirect(new URL("/login?switch=true", req.url));
    res.cookies.set("librarian_session", "", { path: "/", maxAge: 0, expires: new Date(0) });
    res.cookies.set("librarian_impersonate", "", { path: "/", maxAge: 0, expires: new Date(0) });
    return res;
  }

  // 2. Check for public auth pages
  const isPublicPage = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
  const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Check session cookie
  const sessionCookie = req.cookies.get("librarian_session")?.value;
  const isAuthenticated = Boolean(sessionCookie && sessionCookie.length >= 32);

  // If user is already authenticated and visits /login or /register, redirect to dashboard / unless explicit switch requested
  const isSwitching = req.nextUrl.searchParams.has("switch") || req.nextUrl.searchParams.has("logout");
  if (isAuthenticated && isPublicPage && !isSwitching) {
    const dashboardUrl = new URL("/", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Allow access to public pages and public APIs
  if (isPublicPage || isPublicApi) {
    const res = NextResponse.next();
    applySecurityHeaders(res);
    return res;
  }

  // 3. If unauthenticated:
  if (!isAuthenticated) {
    // If it's an API request, return 401 Unauthorized JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "A hozzáféréshez érvényes bejelentkezés szükséges." },
        { status: 401 }
      );
    }

    // If it's a page request, redirect to /login with return URL
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 4. Authenticated request: proceed with security headers applied
  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(res: NextResponse) {
  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.unsplash.com https://*.mega.nz https://mega.nz https://covers.openlibrary.org",
    "connect-src 'self' https://*.mega.nz https://api-m.sandbox.paypal.com https://api-m.paypal.com https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  res.headers.set("Content-Security-Policy", cspHeader);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
