"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading, isDoctor } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isDoctor)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, isDoctor, router]);

  useEffect(() => {
    if (user?.doctor_id) {
      fetchDoctorData();
    }
  }, [user]);

  const fetchDoctorData = async () => {
    try {
      setLoading(true);

      // Obtener citas del médico
      const today = new Date().toISOString().split("T")[0];
      const appointmentsData = await api.getAppointments({
        doctor_id: user?.doctor_id,
        start_date: today,
      });

      setAppointments(appointmentsData.slice(0, 5)); // Solo mostrar 5 próximas

      // Calcular estadísticas
      const todayCount = appointmentsData.filter((apt: any) =>
        apt.start_datetime.startsWith(today)
      ).length;

      const upcomingCount = appointmentsData.filter(
        (apt: any) => apt.status === "scheduled" || apt.status === "confirmed"
      ).length;

      setStats({
        today: todayCount,
        upcoming: upcomingCount,
        completed: 0, // Se calcularía con datos históricos
      });
    } catch (error) {
      console.error("Error fetching doctor data:", error);
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

  if (!isDoctor) {
    return null;
  }

  const handleAppointmentAction = (
    appointmentId: number,
    action: "confirm" | "cancel"
  ) => {
    if (action === "confirm") {
      // Confirmar cita
      api
        .updateAppointment(appointmentId, { status: "confirmed" })
        .then(() => {
          alert("Cita confirmada exitosamente");
          fetchDoctorData();
        })
        .catch((error) => {
          console.error("Error confirming appointment:", error);
          alert("Error al confirmar cita");
        });
    } else {
      // Cancelar cita
      if (confirm("¿Está seguro de cancelar esta cita?")) {
        api
          .updateAppointment(appointmentId, { status: "cancelled" })
          .then(() => {
            alert("Cita cancelada exitosamente");
            fetchDoctorData();
          })
          .catch((error) => {
            console.error("Error cancelling appointment:", error);
            alert("Error al cancelar cita");
          });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Panel del Médico</h1>
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
                {stats.today}
              </div>
              <div className="text-gray-600">Citas Hoy</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.upcoming}
              </div>
              <div className="text-gray-600">Próximas Citas</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.completed}
              </div>
              <div className="text-gray-600">Completadas</div>
            </div>
          </div>

          {/* Próximas citas */}
          <div className="card mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Próximas Citas</h3>
              <button
                onClick={() => router.push("/appointments?doctor=true")}
                className="btn-primary"
              >
                Ver Todas
              </button>
            </div>

            {appointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay citas programadas
              </p>
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
                          {formatDate(appointment.start_datetime, {
                            weekday: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </h4>
                        <p className="text-gray-600 mt-1">
                          Paciente: {appointment.patient_first_name}{" "}
                          {appointment.patient_last_name}
                        </p>
                        <p className="text-gray-600">
                          Tel: {appointment.patient_phone}
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

                        <div className="flex space-x-2">
                          {appointment.status === "scheduled" && (
                            <button
                              onClick={() =>
                                handleAppointmentAction(
                                  appointment.appointment_id,
                                  "confirm"
                                )
                              }
                              className="btn-primary text-sm"
                            >
                              Confirmar
                            </button>
                          )}
                          {appointment.status !== "cancelled" && (
                            <button
                              onClick={() =>
                                handleAppointmentAction(
                                  appointment.appointment_id,
                                  "cancel"
                                )
                              }
                              className="btn-secondary text-sm"
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acciones rápidas */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">
                Horarios de Atención
              </h3>
              <p className="text-gray-600 mb-4">
                Configure sus horarios de atención para que los pacientes puedan
                agendar citas.
              </p>
              <button
                onClick={() => router.push("/dashboard/doctor/schedule")}
                className="btn-primary"
              >
                Gestionar Horarios
              </button>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Mi Perfil</h3>
              <p className="text-gray-600 mb-4">
                Actualice su información personal, especialidades y biografía.
              </p>
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="btn-primary"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
