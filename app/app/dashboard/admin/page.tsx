"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import UserManagement from "@/components/UserManagement";
import DoctorSchedule from "@/components/DoctorSchedule";
import Reports from "@/components/Reports";
import SpecialtiesManagement from "@/components/SpecialtiesManagement";
import AppointmentsManagement from "@/components/AppointmentsManagement";

interface Doctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  specialties?: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const { user, loading, isAdmin } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [loading, user, isAdmin, router]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      const data = await response.json();
      setDoctors(data);
      // Si hay médicos y no hay uno seleccionado, seleccionar el primero
      if (data.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(data[0].doctor_id);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "schedules") {
      fetchDoctors();
    }
  }, [activeTab]);

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
                
                {/* Selector de Médico */}
                <div className="mb-6">
                  <label htmlFor="doctor-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Médico:
                  </label>
                  <select
                    id="doctor-select"
                    value={selectedDoctorId || ""}
                    onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                    className="form-input max-w-md"
                  >
                    <option value="">-- Seleccione un médico --</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.doctor_id} value={doctor.doctor_id}>
                        {doctor.first_name} {doctor.last_name}
                        {doctor.specialties ? ` - ${doctor.specialties}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Componente de Horarios */}
                {selectedDoctorId ? (
                  <DoctorSchedule doctorId={selectedDoctorId} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Por favor, seleccione un médico para configurar sus horarios.
                  </div>
                )}
              </div>
            )}

            {activeTab === "reports" && <Reports />}
          </div>
        </div>
      </div>
    </div>
  );
}
