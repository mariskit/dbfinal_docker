import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que NO requieren sesión
const PUBLIC_PATHS = ["/login", "/register", "/api/auth"];

// Rutas de autenticación (evitar ingresar si ya está logueado)
const AUTH_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("auth-token")?.value || null;
  const userRole = request.cookies.get("user-role")?.value || null;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  // -----------------------------------------------------------
  // 1️⃣ Si intenta entrar a login/register teniendo sesión → dashboard
  // -----------------------------------------------------------
  if (AUTH_PATHS.some((path) => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // -----------------------------------------------------------
  // 2️⃣ Si NO es ruta pública y NO tiene token → redirigir a login
  // -----------------------------------------------------------
  if (!isPublicPath && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // -----------------------------------------------------------
  // 3️⃣ Validación de roles si la ruta requiere permisos
  // -----------------------------------------------------------
  if (token && userRole) {
    // Zona Admin
    if (pathname.startsWith("/dashboard/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Zona Doctor
    if (pathname.startsWith("/dashboard/doctor") && userRole !== "doctor") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Zona Paciente
    if (pathname.startsWith("/dashboard/patient") && userRole !== "patient") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // -----------------------------------------------------------
  // 4️⃣ Permitir continuar
  // -----------------------------------------------------------
  return NextResponse.next();
}

// -----------------------------------------------------------
// Matcher para proteger todas las rutas excepto assets
// -----------------------------------------------------------
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
