"use client";

import { useState, useEffect } from "react";
import { Appointment } from "@/lib/types";

interface AppointmentCalendarProps {
  doctorId?: number;
  patientId?: number;
  onAppointmentSelect?: (appointment: Appointment) => void;
}

export default function AppointmentCalendar({
  doctorId,
  patientId,
  onAppointmentSelect,
}: AppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchAppointments();
  }, [doctorId, patientId, selectedDate]);

  const fetchAppointments = async () => {
    try {
      const params = new URLSearchParams();
      if (doctorId) params.append("doctor_id", doctorId.toString());
      if (patientId) params.append("patient_id", patientId.toString());

      const startOfMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth() + 1,
        0
      );

      params.append("start_date", startOfMonth.toISOString().split("T")[0]);
      params.append("end_date", endOfMonth.toISOString().split("T")[0]);

      const response = await fetch(`/api/appointments?${params}`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.start_datetime);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  type DayCell = {
    date: Date;
    isCurrentMonth: boolean;
    appointments: Appointment[];
  };

  const getDaysInMonth = (): DayCell[] => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: DayCell[] = [];

    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const firstDayOfWeek = firstDay.getDay();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        appointments: [],
      });
    }

    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        appointments: getAppointmentsForDate(date),
      });
    }

    // Días del siguiente mes
    const totalCells = 42; // 6 semanas
    while (days.length < totalCells) {
      const date = new Date(
        year,
        month + 1,
        days.length - lastDay.getDate() - firstDayOfWeek + 1
      );
      days.push({
        date,
        isCurrentMonth: false,
        appointments: [],
      });
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const days = getDaysInMonth();
  const monthName = selectedDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigateMonth("prev")} className="btn-secondary">
          &larr; Anterior
        </button>

        <h2 className="text-xl font-semibold capitalize">{monthName}</h2>

        <button onClick={() => navigateMonth("next")} className="btn-secondary">
          Siguiente &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600 p-2"
          >
            {day}
          </div>
        ))}

        {days.map((day, index) => (
          <div
            key={index}
            className={`min-h-24 border rounded-lg p-2 ${
              day.isCurrentMonth
                ? "bg-white hover:bg-gray-50 cursor-pointer"
                : "bg-gray-50 text-gray-400"
            } ${
              day.date.toDateString() === new Date().toDateString()
                ? "border-blue-500 border-2"
                : "border-gray-200"
            }`}
            onClick={() =>
              day.isCurrentMonth &&
              onAppointmentSelect &&
              console.log("Date selected:", day.date)
            }
          >
            <div className="text-sm font-medium mb-1">{day.date.getDate()}</div>

            <div className="space-y-1">
              {day.appointments.slice(0, 2).map((appointment) => (
                <div
                  key={appointment.appointment_id}
                  className={`text-xs p-1 rounded truncate ${
                    appointment.status === "scheduled"
                      ? "bg-blue-100 text-blue-800"
                      : appointment.status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : appointment.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAppointmentSelect?.(appointment);
                  }}
                >
                  {new Date(appointment.start_datetime).toLocaleTimeString(
                    "es-ES",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                  {doctorId
                    ? ` - ${appointment.patient_first_name}`
                    : ` - Dr. ${appointment.doctor_first_name}`}
                </div>
              ))}

              {day.appointments.length > 2 && (
                <div className="text-xs text-gray-500 text-center">
                  +{day.appointments.length - 2} más
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></div>
            <span>Programada</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></div>
            <span>Confirmada</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-1"></div>
            <span>Cancelada</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-semibold">
            Total: {appointments.length} citas
          </span>
        </div>
      </div>
    </div>
  );
}
