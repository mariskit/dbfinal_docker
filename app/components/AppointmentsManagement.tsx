"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Appointment, Doctor, Patient } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import AppointmentForm from "@/components/AppointmentForm";

export default function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    doctor_id: "",
    patient_id: "",
    status: "",
  });
  const router = useRouter();

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.doctor_id) params.append("doctor_id", filters.doctor_id);
      if (filters.patient_id) params.append("patient_id", filters.patient_id);
      if (filters.status) params.append("status", filters.status);

      const response = await fetch(`/api/appointments?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const handleDelete = async (appointmentId: number) => {
    if (!confirm("¿Está seguro de eliminar esta cita?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Cita eliminada exitosamente");
        fetchAppointments();
      } else {
        alert("Error al eliminar la cita");
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Error al eliminar la cita");
    }
  };

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert("Estado de cita actualizado exitosamente");
        fetchAppointments();
      } else {
        alert("Error al actualizar el estado");
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      alert("Error al actualizar el estado");
    }
  };

  const handleCreate = () => {
    setShowCreateForm(true);
  };

  const handleFormSuccess = () => {
    setShowCreateForm(false);
    fetchAppointments();
  };

  const handleReschedule = (appointment: Appointment) => {
    router.push(`/appointments/${appointment.appointment_id}/reschedule`);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "attended":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: "Programada",
      confirmed: "Confirmada",
      attended: "Atendida",
      cancelled: "Cancelada",
      rescheduled: "Reprogramada",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="loading-spinner mx-auto"></div>;
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Gestión de Citas</h3>
        <button onClick={handleCreate} className="btn-primary">
          Crear Nueva Cita
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Médico
          </label>
          <select
            value={filters.doctor_id}
            onChange={(e) =>
              setFilters({ ...filters, doctor_id: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Todos los médicos</option>
            {doctors.map((doc) => (
              <option key={doc.doctor_id} value={doc.doctor_id.toString()}>
                Dr. {doc.first_name} {doc.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paciente
          </label>
          <select
            value={filters.patient_id}
            onChange={(e) =>
              setFilters({ ...filters, patient_id: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Todos los pacientes</option>
            {patients.map((pat) => (
              <option key={pat.patient_id} value={pat.patient_id.toString()}>
                {pat.first_name} {pat.last_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Todos los estados</option>
            <option value="scheduled">Programada</option>
            <option value="confirmed">Confirmada</option>
            <option value="attended">Atendida</option>
            <option value="cancelled">Cancelada</option>
            <option value="rescheduled">Reprogramada</option>
          </select>
        </div>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-4">Crear Nueva Cita</h4>
          <AppointmentForm onSuccess={handleFormSuccess} />
          <button
            onClick={() => {
              setShowCreateForm(false);
            }}
            className="mt-4 btn-secondary"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Tabla de citas */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Médico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Motivo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No se encontraron citas con los filtros aplicados
                </td>
              </tr>
            ) : (
              appointments.map((appointment) => (
                <tr key={appointment.appointment_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(appointment.start_datetime, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.patient_first_name}{" "}
                    {appointment.patient_last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Dr. {appointment.doctor_first_name}{" "}
                    {appointment.doctor_last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={appointment.status}
                      onChange={(e) =>
                        handleStatusChange(
                          appointment.appointment_id,
                          e.target.value
                        )
                      }
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusBadgeClass(
                        appointment.status
                      )}`}
                    >
                      <option value="scheduled">Programada</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="attended">Atendida</option>
                      <option value="cancelled">Cancelada</option>
                      <option value="rescheduled">Reprogramada</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {appointment.reason || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleReschedule(appointment)}
                      className="text-yellow-600 hover:text-yellow-800"
                      title="Reprogramar cita"
                    >
                      Reprogramar
                    </button>
                    <button
                      onClick={() => handleDelete(appointment.appointment_id)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar cita"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

