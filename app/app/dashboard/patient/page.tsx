"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading, isPatient } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isPatient)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, isPatient, router]);

  useEffect(() => {
    if (user?.patient_id) {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Obtener citas del paciente
      const appointmentsData = await api.getAppointments({
        patient_id: user?.patient_id,
      });

      setAppointments(appointmentsData.slice(0, 3)); // Solo mostrar 3 próximas

      // Calcular estadísticas
      const upcoming = appointmentsData.filter(
        (apt: any) => apt.status === "scheduled" || apt.status === "confirmed"
      ).length;

      const completed = appointmentsData.filter(
        (apt: any) => apt.status === "attended"
      ).length;

      const cancelled = appointmentsData.filter(
        (apt: any) => apt.status === "cancelled"
      ).length;

      setStats({
        upcoming,
        completed,
        cancelled,
      });
    } catch (error) {
      console.error("Error fetching patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isPatient) {
    return null;
  }

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm("¿Está seguro de cancelar esta cita?")) {
      return;
    }

    try {
      await api.updateAppointment(appointmentId, { status: "cancelled" });
      alert("Cita cancelada exitosamente");
      fetchPatientData();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Error al cancelar cita");
    }
  };

  const handleRescheduleAppointment = (appointmentId: number) => {
    // Aquí se implementaría la lógica de reprogramación
    alert("Funcionalidad de reprogramación en desarrollo");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Panel del Paciente</h1>
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
          {/* Estadísticas */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.upcoming}
              </div>
              <div className="text-gray-600">Próximas Citas</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-gray-600">Citas Completadas</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-red-600">
                {stats.cancelled}
              </div>
              <div className="text-gray-600">Citas Canceladas</div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Agendar Nueva Cita</h3>
              <p className="text-gray-600 mb-4">
                Busque médicos disponibles y agende una nueva cita médica.
              </p>
              <button
                onClick={() => router.push("/appointments/new")}
                className="btn-primary"
              >
                Agendar Cita
              </button>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">
                Mi Historial Médico
              </h3>
              <p className="text-gray-600 mb-4">
                Consulte su historial de consultas y resultados médicos.
              </p>
              <button
                onClick={() => router.push("/dashboard/patient/history")}
                className="btn-primary"
              >
                Ver Historial
              </button>
            </div>
          </div>

          {/* Próximas citas */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Mis Próximas Citas</h3>
              <button
                onClick={() => router.push("/appointments")}
                className="btn-primary"
              >
                Ver Todas
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tiene citas programadas</p>
                <button
                  onClick={() => router.push("/appointments/new")}
                  className="btn-primary"
                >
                  Agendar Mi Primera Cita
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.appointment_id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">
                          {formatDate(appointment.start_datetime)}
                        </h4>
                        <p className="text-gray-600 mt-1">
                          Médico: Dr. {appointment.doctor_first_name}{" "}
                          {appointment.doctor_last_name}
                        </p>
                        <p className="text-gray-600">
                          Licencia: {appointment.doctor_license}
                        </p>
                        {appointment.reason && (
                          <p className="text-gray-600 mt-1">
                            Motivo: {appointment.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            appointment.status === "scheduled"
                              ? "bg-blue-100 text-blue-800"
                              : appointment.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : appointment.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {appointment.status === "scheduled"
                            ? "Programada"
                            : appointment.status === "confirmed"
                            ? "Confirmada"
                            : appointment.status === "cancelled"
                            ? "Cancelada"
                            : appointment.status}
                        </span>

                        {appointment.status !== "cancelled" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleRescheduleAppointment(
                                  appointment.appointment_id
                                )
                              }
                              className="btn-secondary text-sm"
                            >
                              Reprogramar
                            </button>
                            <button
                              onClick={() =>
                                handleCancelAppointment(
                                  appointment.appointment_id
                                )
                              }
                              className="btn-secondary text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
