"use client";

import { useState, useEffect } from "react";
import type { Appointment, Doctor, Patient } from "@/lib/types";

export default function Reports() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    doctor_id: "",
    patient_id: "",
    specialty_id: "",
    status: "",
    date_from: "",
    date_to: "",
    year: "",
    month: "",
  });

  useEffect(() => {
    fetchDoctors();
    fetchPatients();
    fetchSpecialties();
    fetchAppointments();
  }, []);

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

  const fetchSpecialties = async () => {
    try {
      const response = await fetch("/api/specialties");
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data);
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.doctor_id) params.append("doctor_id", filters.doctor_id);
      if (filters.patient_id) params.append("patient_id", filters.patient_id);
      if (filters.status) params.append("status", filters.status);
      if (filters.date_from) params.append("start_date", filters.date_from);
      if (filters.date_to) params.append("end_date", filters.date_to);
      if (filters.year) params.append("year", filters.year);
      if (filters.month) params.append("month", filters.month);
      if (filters.specialty_id) params.append("specialty_id", filters.specialty_id);

      const response = await fetch(`/api/appointments?${params.toString()}`);
      if (response.ok) {
        let data = await response.json();
        
        // Filtrar por especialidad si es necesario
        if (filters.specialty_id) {
          data = data.filter((apt: any) => {
            // Esto requeriría una relación con especialidades a través del doctor
            return true; // Por ahora retornamos todos, se puede mejorar
          });
        }

        // Filtrar por año/mes si es necesario
        if (filters.year || filters.month) {
          data = data.filter((apt: any) => {
            const date = new Date(apt.start_datetime);
            if (filters.year && date.getFullYear() !== parseInt(filters.year)) {
              return false;
            }
            if (filters.month && date.getMonth() + 1 !== parseInt(filters.month)) {
              return false;
            }
            return true;
          });
        }

        setAppointments(data);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAppointments();
  };

  const handleClearFilters = () => {
    setFilters({
      doctor_id: "",
      patient_id: "",
      specialty_id: "",
      status: "",
      date_from: "",
      date_to: "",
      year: "",
      month: "",
    });
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {};
    appointments.forEach((apt) => {
      counts[apt.status] = (counts[apt.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Generar lista de años y meses
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-6">Reportes de Citas</h3>

      {/* Filtros */}
      <form onSubmit={handleApplyFilters} className="mb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Médico
            </label>
            <select
              value={filters.doctor_id}
              onChange={(e) => handleFilterChange("doctor_id", e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Todos los médicos</option>
              {doctors.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
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
              onChange={(e) => handleFilterChange("patient_id", e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Todos los pacientes</option>
              {patients.map((pat) => (
                <option key={pat.patient_id} value={pat.patient_id}>
                  {pat.first_name} {pat.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especialidad
            </label>
            <select
              value={filters.specialty_id}
              onChange={(e) =>
                handleFilterChange("specialty_id", e.target.value)
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((spec) => (
                <option key={spec.specialty_id} value={spec.specialty_id}>
                  {spec.name}
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
              onChange={(e) => handleFilterChange("status", e.target.value)}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange("date_from", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange("date_to", e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Año
            </label>
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Todos los años</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mes
            </label>
            <select
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Todos los meses</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary">
            Aplicar Filtros
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className="btn-secondary"
          >
            Limpiar Filtros
          </button>
        </div>
      </form>

      {/* Estadísticas */}
      <div className="grid md:grid-cols-5 gap-4 mb-6">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {appointments.length}
          </div>
          <div className="text-gray-600">Total</div>
        </div>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{count}</div>
            <div className="text-gray-600">
              {status === "scheduled"
                ? "Programadas"
                : status === "confirmed"
                ? "Confirmadas"
                : status === "attended"
                ? "Atendidas"
                : status === "cancelled"
                ? "Canceladas"
                : status === "rescheduled"
                ? "Reprogramadas"
                : status}
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de citas */}
      {loading ? (
        <div className="text-center py-8">
          <div className="loading-spinner mx-auto"></div>
        </div>
      ) : (
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron citas con los filtros aplicados
                  </td>
                </tr>
              ) : (
                appointments.map((appointment) => (
                  <tr key={appointment.appointment_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(appointment.start_datetime).toLocaleString(
                        "es-ES"
                      )}
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
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === "scheduled"
                            ? "bg-blue-100 text-blue-800"
                            : appointment.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "attended"
                            ? "bg-purple-100 text-purple-800"
                            : appointment.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {appointment.status === "scheduled"
                          ? "Programada"
                          : appointment.status === "confirmed"
                          ? "Confirmada"
                          : appointment.status === "attended"
                          ? "Atendida"
                          : appointment.status === "cancelled"
                          ? "Cancelada"
                          : appointment.status === "rescheduled"
                          ? "Reprogramada"
                          : appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {appointment.reason || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

