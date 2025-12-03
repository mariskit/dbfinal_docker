"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  ChartBarIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
}

export default function DashboardPage() {
  const { user, loading, isAuthenticated, isAdmin, isDoctor, isPatient } =
    useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return <LoadingSpinner message="Cargando dashboard..." fullScreen />;
  }

  if (!user) {
    return null;
  }

  // Cards basadas en el rol
  const getDashboardCards = (): DashboardCard[] => {
    const baseCards = [
      {
        title: "Mi Perfil",
        description: "Gestionar información personal",
        icon: UserIcon,
        href: "/dashboard/profile",
        color: "text-purple-600",
        bgColor: "bg-purple-50 hover:bg-purple-100",
      },
      {
        title: "Notificaciones",
        description: "Ver mis notificaciones",
        icon: BellIcon,
        href: "/dashboard/notifications",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 hover:bg-yellow-100",
      },
    ];

    if (isAdmin) {
      return [
        {
          title: "Gestión de Usuarios",
          description: "Administrar pacientes, médicos y administradores",
          icon: UserGroupIcon,
          href: "/dashboard/admin",
          color: "text-blue-600",
          bgColor: "bg-blue-50 hover:bg-blue-100",
        },
        {
          title: "Reportes del Sistema",
          description: "Ver estadísticas y generar reportes",
          icon: ChartBarIcon,
          href: "/dashboard/admin?tab=reports",
          color: "text-green-600",
          bgColor: "bg-green-50 hover:bg-green-100",
        },
        ...baseCards,
      ];
    }

    if (isDoctor) {
      return [
        {
          title: "Mi Agenda",
          description: "Ver mis citas programadas",
          icon: CalendarIcon,
          href: "/appointments?doctor=true",
          color: "text-blue-600",
          bgColor: "bg-blue-50 hover:bg-blue-100",
        },
        {
          title: "Horarios",
          description: "Gestionar mis horarios disponibles",
          icon: ClockIcon,
          href: "/dashboard/doctor/schedule",
          color: "text-green-600",
          bgColor: "bg-green-50 hover:bg-green-100",
        },
        {
          title: "Mis Pacientes",
          description: "Ver historial de mis pacientes",
          icon: UserGroupIcon,
          href: "/dashboard/doctor/patients",
          color: "text-purple-600",
          bgColor: "bg-purple-50 hover:bg-purple-100",
        },
        ...baseCards,
      ];
    }

    if (isPatient) {
      return [
        {
          title: "Nueva Cita",
          description: "Agendar una nueva cita médica",
          icon: CalendarIcon,
          href: "/appointments/new",
          color: "text-blue-600",
          bgColor: "bg-blue-50 hover:bg-blue-100",
        },
        {
          title: "Mis Citas",
          description: "Ver mis citas programadas",
          icon: CalendarIcon,
          href: "/appointments",
          color: "text-green-600",
          bgColor: "bg-green-50 hover:bg-green-100",
        },
        {
          title: "Historial Médico",
          description: "Ver mi historial de consultas",
          icon: DocumentTextIcon,
          href: "/dashboard/patient/history",
          color: "text-purple-600",
          bgColor: "bg-purple-50 hover:bg-purple-100",
        },
        ...baseCards,
      ];
    }

    return baseCards;
  };

  const dashboardCards = getDashboardCards();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Bienvenido de vuelta,{" "}
                <span className="font-semibold">{user.name}</span>
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isAdmin
                      ? "bg-purple-100 text-purple-800"
                      : isDoctor
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {isAdmin ? "Administrador" : isDoctor ? "Médico" : "Paciente"}
                </span>
                <span className="text-sm text-gray-500">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Acciones Rápidas
          </h2>
          <p className="text-gray-600">Selecciona una opción para comenzar</p>
        </div>

        {/* Grid de cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card, index) => (
            <button
              key={index}
              onClick={() => router.push(card.href)}
              className={`${card.bgColor} border border-transparent rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-8 h-8 ${card.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {card.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-gray-500">
                <span>Haz clic para acceder</span>
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Información rápida */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">
              Próximas actividades
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600">
                  No hay actividades próximas
                </span>
              </div>
              <button
                onClick={() => router.push("/appointments")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas las citas →
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">
              Estadísticas rápidas
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {isDoctor ? "0" : isPatient ? "0" : "3"}
                </div>
                <div className="text-sm text-gray-600">
                  {isDoctor
                    ? "Citas hoy"
                    : isPatient
                    ? "Citas pendientes"
                    : "Usuarios activos"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Sistema</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="text-green-600 font-medium">✓ Operativo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Versión:</span>
                <span className="text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Último acceso:</span>
                <span className="text-gray-900">Hoy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
