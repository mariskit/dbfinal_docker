import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Simulación simple de autenticación
  const token = request.cookies.get("auth-token");
  const userRole = request.cookies.get("user-role");

  // Rutas protegidas
  const protectedPaths = ["/dashboard", "/appointments"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verificación de roles para rutas específicas
  if (
    request.nextUrl.pathname.startsWith("/dashboard/admin") &&
    userRole?.value !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    request.nextUrl.pathname.startsWith("/dashboard/doctor") &&
    userRole?.value !== "doctor"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    request.nextUrl.pathname.startsWith("/dashboard/patient") &&
    userRole?.value !== "patient"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/appointments/:path*",
    "/api/appointments/:path*",
    "/api/doctors/:path*",
    "/api/patients/:path*",
  ],
};
