"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";

export default function Navbar() {
  const { user, logout, isAdmin, isDoctor, isPatient } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // No mostrar navbar en páginas de login/register
  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y menú izquierdo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">ClinicApp</span>
            </Link>

            {/* Navegación principal */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === "/dashboard"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Dashboard
              </Link>

              <Link
                href="/appointments"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith("/appointments")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {isDoctor ? "Mi Agenda" : "Mis Citas"}
              </Link>

              {isAdmin && (
                <>
                  <Link
                    href="/dashboard/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname.startsWith("/dashboard/admin")
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Administración
                  </Link>
                </>
              )}

              {isDoctor && (
                <>
                  <Link
                    href="/dashboard/doctor/schedule"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname.includes("/schedule")
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Horarios
                  </Link>
                </>
              )}

              {isPatient && (
                <Link
                  href="/dashboard/patient/history"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname.includes("/history")
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Historial
                </Link>
              )}

              <Link
                href="/dashboard/profile"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.includes("/profile")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Perfil
              </Link>
            </div>
          </div>

          {/* Usuario y logout */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm">
                <div className="font-medium text-gray-700">
                  Hola, {user?.name || "Usuario"}
                </div>
                <div className="text-gray-500 text-xs">
                  {isAdmin
                    ? "Administrador"
                    : isDoctor
                    ? "Médico"
                    : isPatient
                    ? "Paciente"
                    : "Usuario"}
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>

            {/* Botón menú móvil */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Abrir menú</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/dashboard"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>

            <Link
              href="/appointments"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              {isDoctor ? "Mi Agenda" : "Mis Citas"}
            </Link>

            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Administración
              </Link>
            )}

            {isDoctor && (
              <Link
                href="/dashboard/doctor/schedule"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Horarios
              </Link>
            )}

            {isPatient && (
              <Link
                href="/dashboard/patient/history"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Historial
              </Link>
            )}

            <Link
              href="/dashboard/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              Perfil
            </Link>

            <div className="pt-4 border-t">
              <div className="px-3 py-2">
                <div className="text-sm font-medium text-gray-700">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-base font-medium text-white bg-red-600 hover:bg-red-700"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
