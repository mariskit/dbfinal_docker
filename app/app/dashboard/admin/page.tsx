"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import UserManagement from "@/components/UserManagement";
import DoctorSchedule from "@/components/DoctorSchedule";
import Reports from "@/components/Reports";
import SpecialtiesManagement from "@/components/SpecialtiesManagement";
import AppointmentsManagement from "@/components/AppointmentsManagement";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const { user, loading, isAdmin } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Panel de Administración</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="btn-secondary"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "users", name: "Gestión de Usuarios" },
                { id: "appointments", name: "Gestión de Citas" },
                { id: "specialties", name: "Especialidades" },
                { id: "doctors", name: "Médicos" },
                { id: "schedules", name: "Horarios" },
                { id: "reports", name: "Reportes" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === "users" && <UserManagement />}

            {activeTab === "appointments" && <AppointmentsManagement />}

            {activeTab === "specialties" && <SpecialtiesManagement />}

            {activeTab === "doctors" && (
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">
                  Gestión de Médicos
                </h3>
                <p className="text-gray-600 mb-4">
                  Administre la información de los médicos del sistema.
                </p>
                <button className="btn-primary">Agregar Nuevo Médico</button>
              </div>
            )}

            {activeTab === "schedules" && (
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Horarios Médicos</h3>
                <p className="text-gray-600 mb-4">
                  Configure los horarios de atención de los médicos.
                </p>
                <DoctorSchedule doctorId={1} />
              </div>
            )}

            {activeTab === "reports" && <Reports />}
          </div>
        </div>
      </div>
    </div>
  );
}
