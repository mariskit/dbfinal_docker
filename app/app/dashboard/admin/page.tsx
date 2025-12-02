"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import UserManagement from "@/components/UserManagement";
import DoctorSchedule from "@/components/DoctorSchedule";

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

            {activeTab === "reports" && (
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">
                  Reportes del Sistema
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">150</div>
                    <div className="text-gray-600">Citas Totales</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">125</div>
                    <div className="text-gray-600">Citas Completadas</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">25</div>
                    <div className="text-gray-600">Citas Canceladas</div>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">5</div>
                    <div className="text-gray-600">Médicos Activos</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Citas por Mes</h4>
                    <div className="space-y-2">
                      {[
                        "Enero",
                        "Febrero",
                        "Marzo",
                        "Abril",
                        "Mayo",
                        "Junio",
                      ].map((mes, index) => (
                        <div key={mes} className="flex items-center">
                          <div className="w-24 text-sm text-gray-600">
                            {mes}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-blue-500 rounded-full h-4"
                              style={{ width: `${(index + 1) * 15}%` }}
                            ></div>
                          </div>
                          <div className="w-10 text-right text-sm font-medium">
                            {(index + 1) * 15}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">
                      Especialidades Populares
                    </h4>
                    <div className="space-y-2">
                      {[
                        { name: "Medicina General", count: 45 },
                        { name: "Cardiología", count: 35 },
                        { name: "Pediatría", count: 30 },
                        { name: "Dermatología", count: 25 },
                        { name: "Ginecología", count: 15 },
                      ].map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm">{item.name}</span>
                          <span className="text-sm font-medium">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
