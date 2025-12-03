"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import type { Appointment } from "@/lib/types";

function AppointmentsContent() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const { isDoctor, isAdmin, isPatient, user } = useAuthContext();
  const isDoctorView = searchParams.get("doctor") === "true" || isDoctor;

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      let url = "/api/appointments";
      if (isDoctorView && user?.doctor_id) {
        url += `?doctor_id=${user.doctor_id}`;
      } else if (user?.patient_id) {
        url += `?patient_id=${user.patient_id}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm("¿Está seguro de que desea cancelar esta cita?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      if (response.ok) {
        fetchAppointments(); // Recargar la lista
        alert("Cita cancelada exitosamente");
      } else {
        alert("Error al cancelar la cita");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Error al cancelar la cita");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">
                {isDoctorView ? "Mi Agenda Médica" : "Mis Citas"}
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {isDoctorView ? "Citas Programadas" : "Mis Próximas Citas"}
              </h2>
              {!isDoctorView && (
                <button
                  onClick={() => (window.location.href = "/appointments/new")}
                  className="btn-primary"
                >
                  Nueva Cita
                </button>
              )}
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay citas programadas</p>
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
                        <h3 className="font-semibold">
                          {new Date(
                            appointment.start_datetime
                          ).toLocaleDateString("es-ES", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {isDoctorView ? (
                            <>
                              Paciente: {appointment.patient_first_name}{" "}
                              {appointment.patient_last_name}
                            </>
                          ) : (
                            <>
                              Médico: Dr. {appointment.doctor_first_name}{" "}
                              {appointment.doctor_last_name}
                            </>
                          )}
                        </p>
                        {appointment.reason && (
                          <p className="text-gray-600 mt-1">
                            Motivo: {appointment.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
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
                          <>
                            {/* Solo pacientes y admins pueden reprogramar */}
                            {(isPatient || isAdmin) && !isDoctor && (
                              <button
                                onClick={() =>
                                  (window.location.href = `/appointments/${appointment.appointment_id}/reschedule`)
                                }
                                className="btn-primary text-sm"
                              >
                                Reprogramar
                              </button>
                            )}
                            {/* Todos pueden cancelar */}
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
                          </>
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

export default function AppointmentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    }>
      <AppointmentsContent />
    </Suspense>
  );
}
