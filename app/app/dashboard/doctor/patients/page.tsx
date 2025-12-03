"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import { formatDate } from "@/lib/utils";
import type { Appointment, Patient } from "@/lib/types";

interface DoctorPatient extends Patient {
  appointments: Appointment[];
  totalAppointments: number;
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);
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
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Obtener todas las citas del médico
      const appointmentsResponse = await fetch(
        `/api/appointments?doctor_id=${user?.doctor_id}`
      );
      const appointmentsData = await appointmentsResponse.json();

      // Agrupar por paciente
      const patientMap = new Map<number, DoctorPatient>();

      for (const apt of appointmentsData) {
        if (!patientMap.has(apt.patient_id)) {
          patientMap.set(apt.patient_id, {
            patient_id: apt.patient_id,
            user_id: 0,
            first_name: apt.patient_first_name || "",
            last_name: apt.patient_last_name || "",
            birthdate: null,
            phone: apt.patient_phone || null,
            address: null,
            created_at: "",
            appointments: [],
            totalAppointments: 0,
          });
        }

        const patient = patientMap.get(apt.patient_id)!;
        patient.appointments.push(apt);
        patient.totalAppointments++;
      }

      // Obtener información completa de pacientes
      const patientsList = Array.from(patientMap.values());
      for (const patient of patientsList) {
        try {
          const patientResponse = await fetch(
            `/api/patients?patient_id=${patient.patient_id}`
          );
          if (patientResponse.ok) {
            const patientData = await patientResponse.json();
            if (patientData && patientData.length > 0) {
              const fullPatient = patientData[0];
              patient.birthdate = fullPatient.birthdate;
              patient.address = fullPatient.address;
              patient.user_id = fullPatient.user_id;
            }
          }
        } catch (error) {
          console.error("Error fetching patient details:", error);
        }
      }

      // Ordenar por apellido
      patientsList.sort((a, b) => a.last_name.localeCompare(b.last_name));

      setPatients(patientsList);
    } catch (error) {
      console.error("Error fetching patients:", error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card mb-6">
            <h1 className="text-2xl font-bold mb-4">Mis Pacientes</h1>
            <p className="text-gray-600">
              Lista de todos los pacientes que han tenido citas con usted
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Lista de pacientes */}
            <div className="md:col-span-1">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">
                  Pacientes ({patients.length})
                </h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {patients.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No hay pacientes registrados
                    </p>
                  ) : (
                    patients.map((patient) => (
                      <button
                        key={patient.patient_id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedPatient?.patient_id === patient.patient_id
                            ? "bg-blue-50 border-blue-300"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.totalAppointments} cita
                          {patient.totalAppointments !== 1 ? "s" : ""}
                        </div>
                        {patient.phone && (
                          <div className="text-xs text-gray-400">
                            {patient.phone}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Detalles del paciente seleccionado */}
            <div className="md:col-span-2">
              {selectedPatient ? (
                <div className="space-y-6">
                  {/* Información básica */}
                  <div className="card">
                    <h2 className="text-xl font-semibold mb-4">
                      Información del Paciente
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Nombre Completo
                        </label>
                        <p className="text-gray-900">
                          {selectedPatient.first_name}{" "}
                          {selectedPatient.last_name}
                        </p>
                      </div>
                      {selectedPatient.birthdate && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Fecha de Nacimiento
                          </label>
                          <p className="text-gray-900">
                            {new Date(
                              selectedPatient.birthdate
                            ).toLocaleDateString("es-ES")}
                          </p>
                        </div>
                      )}
                      {selectedPatient.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Teléfono
                          </label>
                          <p className="text-gray-900">
                            {selectedPatient.phone}
                          </p>
                        </div>
                      )}
                      {selectedPatient.address && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">
                            Dirección
                          </label>
                          <p className="text-gray-900">
                            {selectedPatient.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Historial de citas */}
                  <div className="card">
                    <h2 className="text-xl font-semibold mb-4">
                      Historial de Citas
                    </h2>
                    <div className="space-y-4">
                      {selectedPatient.appointments.length === 0 ? (
                        <p className="text-gray-500">
                          No hay citas registradas
                        </p>
                      ) : (
                        selectedPatient.appointments
                          .sort(
                            (a, b) =>
                              new Date(b.start_datetime).getTime() -
                              new Date(a.start_datetime).getTime()
                          )
                          .map((appointment) => (
                            <div
                              key={appointment.appointment_id}
                              className="border rounded-lg p-4"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold">
                                    {formatDate(appointment.start_datetime, {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </h3>
                                  {appointment.reason && (
                                    <p className="text-gray-600 mt-1">
                                      Motivo: {appointment.reason}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
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
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <p className="text-gray-500 text-center py-8">
                    Seleccione un paciente para ver sus detalles
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

