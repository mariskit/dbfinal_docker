"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";

interface Doctor {
  doctor_id: number;
  first_name: string;
  last_name: string;
  specialties: string;
  email: string;
}

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AppointmentFormProps {
  appointmentId?: number;
  initialData?: {
    doctor_id: number;
    start_datetime: string;
    reason: string;
  };
  onSuccess?: () => void;
}

export default function AppointmentForm({
  appointmentId,
  initialData,
  onSuccess,
}: AppointmentFormProps) {
  const { user, isAdmin, isPatient } = useAuthContext();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState(
    initialData?.doctor_id?.toString() || ""
  );
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    initialData?.start_datetime
      ? new Date(initialData.start_datetime).toISOString().split("T")[0]
      : ""
  );
  const [selectedTime, setSelectedTime] = useState(
    initialData?.start_datetime
      ? new Date(initialData.start_datetime).toTimeString().slice(0, 5)
      : ""
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [reason, setReason] = useState(initialData?.reason || "");
  const [loading, setLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [noScheduleAvailable, setNoScheduleAvailable] = useState(false);
  const router = useRouter();
  const isEditMode = !!appointmentId;

  useEffect(() => {
    fetchDoctors();
    if (isAdmin) {
      fetchPatients();
    } else if (isPatient && user?.patient_id) {
      setSelectedPatient(user.patient_id.toString());
    }
  }, [isAdmin, isPatient, user]);

  useEffect(() => {
    if (initialData) {
      setSelectedDoctor(initialData.doctor_id.toString());
      const date = new Date(initialData.start_datetime);
      setSelectedDate(date.toISOString().split("T")[0]);
      setSelectedTime(date.toTimeString().slice(0, 5));
      setReason(initialData.reason || "");
    }
  }, [initialData]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchTimeSlots();
    } else {
      setTimeSlots([]);
      setNoScheduleAvailable(false);
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors");
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients");
      const data = await response.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchTimeSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    setScheduleLoading(true);
    setNoScheduleAvailable(false);
    setSelectedTime(""); // Limpiar hora seleccionada

    try {
      let url = `/api/appointments/schedule?doctor_id=${selectedDoctor}&date=${selectedDate}`;
      // Si estamos reprogramando, excluir la cita actual de las ocupadas
      if (appointmentId) {
        url += `&exclude_appointment_id=${appointmentId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      console.log("Schedule data:", data); // Debug

      if (data.schedules && data.schedules.length > 0) {
        const schedule = data.schedules[0];
        const slots = generateTimeSlots(
          schedule.start_time,
          schedule.end_time,
          schedule.slot_duration_min,
          data.appointments || []
        );

        // Filtrar solo horarios disponibles
        const availableSlots = slots.filter((slot) => slot.available);

        console.log("Total slots:", slots.length); // Debug
        console.log("Available slots:", availableSlots.length); // Debug

        if (availableSlots.length === 0) {
          setNoScheduleAvailable(true);
          setTimeSlots([]);
        } else {
          setNoScheduleAvailable(false);
          setTimeSlots(availableSlots);
        }
      } else {
        // No hay horario configurado para este día
        setNoScheduleAvailable(true);
        setTimeSlots([]);
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      setNoScheduleAvailable(true);
      setTimeSlots([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const generateTimeSlots = (
    startTime: string,
    endTime: string,
    duration: number,
    appointments: any[]
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const start = new Date(`${selectedDate}T${startTime}`);
    const end = new Date(`${selectedDate}T${endTime}`);

    let current = new Date(start);

    while (current < end) {
      const slotEnd = new Date(current.getTime() + duration * 60000);
      const timeString = current.toTimeString().slice(0, 5);

      // Verificar si el slot está ocupado
      const isAvailable = !appointments.some((apt) => {
        const aptStart = new Date(apt.start_datetime);
        const aptEnd = new Date(apt.end_datetime);
        return current < aptEnd && slotEnd > aptStart;
      });

      slots.push({
        time: timeString,
        available: isAvailable,
      });

      current = slotEnd;
    }

    return slots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctor || !selectedDate || !selectedTime || !reason) {
      alert("Por favor complete todos los campos");
      return;
    }

    // Validar que se haya seleccionado paciente si es admin
    if (isAdmin && !selectedPatient) {
      alert("Por favor seleccione un paciente");
      return;
    }

    // Validar que haya paciente seleccionado para pacientes
    if (isPatient && !user?.patient_id) {
      alert("Error: No se pudo identificar el paciente");
      return;
    }

    setLoading(true);

    try {
      const startDatetime = `${selectedDate}T${selectedTime}:00`;
      const endDatetime = `${selectedDate}T${add30Minutes(selectedTime)}:00`;

      if (isEditMode && appointmentId) {
        // Modo edición: actualizar cita existente
        const response = await fetch(`/api/appointments/${appointmentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            start_datetime: startDatetime,
            end_datetime: endDatetime,
            reason: reason,
            event_by_user_id: user?.id || 1,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          alert("Cita reprogramada exitosamente");
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/appointments");
          }
        } else {
          alert(data.error || "Error al reprogramar la cita");
        }
      } else {
        // Modo creación: crear nueva cita
        const patientId = isAdmin 
          ? parseInt(selectedPatient)
          : (user?.patient_id || 1);

        if (!patientId) {
          alert("Error: No se pudo determinar el paciente");
          setLoading(false);
          return;
        }

        const appointmentData = {
          patient_id: patientId,
          doctor_id: parseInt(selectedDoctor),
          start_datetime: startDatetime,
          end_datetime: endDatetime,
          reason: reason,
          created_by_user_id: user?.id || 1,
          channel: "web",
        };

        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(appointmentData),
        });

        const data = await response.json();

        if (response.ok) {
          alert("Cita agendada exitosamente");
          if (onSuccess) {
            onSuccess();
          } else {
            router.push("/appointments");
          }
        } else {
          alert(data.error || "Error al agendar la cita");
        }
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert(isEditMode ? "Error al reprogramar la cita" : "Error al agendar la cita");
    } finally {
      setLoading(false);
    }
  };

  const add30Minutes = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes + 30);
    return date.toTimeString().slice(0, 5);
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // No permitir citas para hoy
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isEditMode ? "Reprogramar Cita" : "Agendar Nueva Cita"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de paciente solo para administradores */}
        {isAdmin && !isEditMode && (
          <div>
            <label className="form-label">Paciente</label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="form-input"
              required
            >
              <option value="">Seleccione un paciente</option>
              {patients.map((patient) => (
                <option key={patient.patient_id} value={patient.patient_id}>
                  {patient.first_name} {patient.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="form-label">Médico</label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="form-input"
            required
            disabled={isEditMode}
          >
            <option value="">Seleccione un médico</option>
            {doctors.map((doctor) => (
              <option key={doctor.doctor_id} value={doctor.doctor_id}>
                Dr. {doctor.first_name} {doctor.last_name}
                {doctor.specialties && ` - ${doctor.specialties}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Fecha</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            className="form-input"
            required
          />
        </div>

        <div>
          <label className="form-label">Hora</label>
          {scheduleLoading ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
              <span className="ml-3 text-gray-600">
                Cargando horarios disponibles...
              </span>
            </div>
          ) : selectedDoctor && selectedDate ? (
            noScheduleAvailable || timeSlots.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-yellow-400 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-yellow-800 font-medium mb-2">
                  No hay horarios disponibles
                </p>
                <p className="text-yellow-700 text-sm">
                  El médico seleccionado no tiene horarios disponibles para esta
                  fecha. Por favor, seleccione otra fecha o consulte con otro
                  médico.
                </p>
              </div>
            ) : timeSlots.length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`p-3 rounded border text-sm font-medium transition-all ${
                        selectedTime === slot.time
                          ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {timeSlots.length} horario{timeSlots.length !== 1 ? "s" : ""}{" "}
                  disponible{timeSlots.length !== 1 ? "s" : ""}
                </p>
              </>
            ) : null
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500 text-sm">
                Seleccione un médico y una fecha para ver los horarios
                disponibles
              </p>
            </div>
          )}
          {selectedTime && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✓ Hora seleccionada: {selectedTime}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="form-label">Motivo de la consulta</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="form-input"
            placeholder="Describa el motivo de su consulta..."
            required
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !selectedTime || (isAdmin && !selectedPatient)}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? isEditMode
                ? "Reprogramando..."
                : "Agendando..."
              : isEditMode
              ? "Reprogramar Cita"
              : "Agendar Cita"}
          </button>
        </div>
      </form>
    </div>
  );
}
