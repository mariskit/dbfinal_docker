"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

export default function PatientHistoryPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const { user, loading: authLoading, isPatient } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isPatient)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, isPatient, router]);

  const fetchAppointmentHistory = useCallback(async () => {
    if (!user?.patient_id) {
      console.log("No patient_id available");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Fetching appointments for patient:", user.patient_id);
      const data = await api.getAppointments({
        patient_id: user.patient_id,
      });
      console.log("Appointments fetched:", data);
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointment history:", error);
      setError("Error al cargar el historial de citas");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.patient_id]);

  useEffect(() => {
    fetchAppointmentHistory();
  }, [fetchAppointmentHistory]);

  const filterAppointments = useCallback(() => {
    let filtered = [...appointments];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (apt) =>
          apt.doctor_first_name?.toLowerCase().includes(term) ||
          apt.doctor_last_name?.toLowerCase().includes(term) ||
          apt.reason?.toLowerCase().includes(term) ||
          apt.channel?.toLowerCase().includes(term)
      );
    }

    // Filtrar por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter((apt) => apt.status === statusFilter);
    }

    // Filtrar por fecha
    if (dateFilter) {
      filtered = filtered.filter((apt) =>
        apt.start_datetime.startsWith(dateFilter)
      );
    }

    // Ordenar por fecha más reciente
    filtered.sort(
      (a, b) =>
        new Date(b.start_datetime).getTime() -
        new Date(a.start_datetime).getTime()
    );

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    filterAppointments();
  }, [filterAppointments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "attended":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "attended":
        return "Atendida";
      case "cancelled":
        return "Cancelada";
      case "confirmed":
        return "Confirmada";
      case "scheduled":
        return "Programada";
      default:
        return status;
    }
  };

  const getChannelText = (channel: string | null) => {
    switch (channel || "") {
      case "presencial":
        return "Presencial";
      case "virtual":
        return "Virtual";
      case "telefono":
        return "Teléfono";
      default:
        return channel || "N/A";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-lg font-semibold">{error}</p>
          <button onClick={fetchAppointmentHistory} className="btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-semibold">Mi Historial Médico</h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            {/* Filtros */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Filtros de Búsqueda</h2>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="form-label">Buscar</label>
                  <input
                    type="text"
                    placeholder="Médico, motivo, etc."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Estado</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-input"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="attended">Atendida</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="scheduled">Programada</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">
                  {filteredAppointments.length} citas encontradas
                </span>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDateFilter("");
                  }}
                  className="btn-secondary"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Lista de citas */}
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {appointments.length === 0
                    ? "No tienes citas registradas"
                    : "No se encontraron citas con los filtros aplicados"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment.appointment_id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {formatDate(appointment.start_datetime)}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              Dr. {appointment.doctor_first_name}{" "}
                              {appointment.doctor_last_name}
                            </p>
                            <p className="text-gray-600 text-sm">
                              Licencia: {appointment.doctor_license}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                appointment.status
                              )}`}
                            >
                              {getStatusText(appointment.status)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {getChannelText(appointment.channel)}
                            </span>
                          </div>
                        </div>

                        {appointment.reason && (
                          <div className="mt-3">
                            <h4 className="font-semibold text-sm">
                              Motivo de la consulta:
                            </h4>
                            <p className="text-gray-600 text-sm mt-1">
                              {appointment.reason}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t">
                          <div className="flex space-x-4 text-sm">
                            <span className="text-gray-500">
                              Inicio:{" "}
                              {new Date(
                                appointment.start_datetime
                              ).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-gray-500">
                              Fin:{" "}
                              {new Date(
                                appointment.end_datetime
                              ).toLocaleTimeString("es-ES", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="text-gray-500">
                              Duración:{" "}
                              {Math.round(
                                (new Date(appointment.end_datetime).getTime() -
                                  new Date(
                                    appointment.start_datetime
                                  ).getTime()) /
                                  (1000 * 60)
                              )}{" "}
                              min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {appointment.status === "attended" && (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={() =>
                            alert("Funcionalidad de ver detalles en desarrollo")
                          }
                          className="btn-primary text-sm"
                        >
                          Ver Detalles de la Consulta
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Resumen */}
            {appointments.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h4 className="font-semibold mb-3">Resumen de Historial</h4>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {appointments.length}
                    </div>
                    <div className="text-gray-600">Total de Citas</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        appointments.filter((a) => a.status === "attended")
                          .length
                      }
                    </div>
                    <div className="text-gray-600">Citas Atendidas</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {
                        appointments.filter(
                          (a) =>
                            a.status === "scheduled" || a.status === "confirmed"
                        ).length
                      }
                    </div>
                    <div className="text-gray-600">Citas Pendientes</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {
                        appointments.filter((a) => a.status === "cancelled")
                          .length
                      }
                    </div>
                    <div className="text-gray-600">Citas Canceladas</div>
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
