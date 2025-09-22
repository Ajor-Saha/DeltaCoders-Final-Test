import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to home page
  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // List of paths that do not require authentication
  const publicPaths = ["/home", "/sign-in", "/signup", "/verify/:email", "/create-new-company"];

  // Auth-only paths (logged in users shouldn't access these)
  const authOnlyPaths = ["/sign-in", "/create-new-company"];

  // Allow API authentication endpoints without session validation
  const apiAuthPaths = ["/api/auth/", "/api/auth/**"];

  // Check for token in cookies with domain-aware handling
  const token = request.cookies.get("accessToken")?.value || 
                request.headers.get("Authorization")?.replace("Bearer ", "") || "";

  const response = NextResponse.next();

  // Set cookie domain to .taskforges.com to allow sharing between subdomains
  if (token && !request.cookies.get("accessToken")) {
    response.cookies.set({
      name: "accessToken",
      value: token,
      domain: ".taskforges.com",
      path: "/",
      secure: true,
      sameSite: "none",
      httpOnly: true
    });
  }

  const isAuthenticated = !!token;

  // Check if the current path matches any of our public paths, including dynamic routes
  const isPublicPath = publicPaths.some((path) => {
    // Handle dynamic routes by replacing :param with a wildcard pattern
    const pathPattern = path.replace(/:[\w]+/g, '[^/]+');
    const regex = new RegExp(`^${pathPattern}(?:/.*)?$`);
    return regex.test(pathname);
  });

  // For public paths or API auth paths, allow access without token validation
  if (
    isPublicPath ||
    apiAuthPaths.some((path) => pathname.startsWith(path.replace("**", "")))
  ) {
    // If user is authenticated and trying to access auth-only pages, redirect to home
    if (
      isAuthenticated &&
      authOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    ) {
      const redirectResponse = NextResponse.redirect(new URL("/home", request.url));
      // Copy cookies to redirect response
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
    
    return response;
  }

  // For private paths, check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login if no token found
    const redirectResponse = NextResponse.redirect(new URL("/sign-in", request.url));
    // Copy cookies to redirect response
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  // Allow access if the token is valid
  return response;
}

// Config to match specific paths for the middleware
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
