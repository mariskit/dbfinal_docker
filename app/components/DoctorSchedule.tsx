"use client";

import { useState, useEffect } from "react";

interface Schedule {
  schedule_id: number;
  doctor_id: number;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_min: number;
}

const weekdays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function DoctorSchedule({ doctorId }: { doctorId: number }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weekday: 1,
    start_time: "08:00",
    end_time: "17:00",
    slot_duration_min: 30,
  });

  useEffect(() => {
    fetchSchedules();
  }, [doctorId]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}/schedules`);
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/appointments/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          doctor_id: doctorId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowForm(false);
        fetchSchedules();
        alert("Horario agregado exitosamente");
      } else {
        alert(data.error || "Error al agregar horario");
      }
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Error al agregar horario");
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (!confirm("¿Está seguro de que desea eliminar este horario?")) {
      return;
    }

    try {
      const response = await fetch(`/api/doctors/schedules/${scheduleId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSchedules();
        alert("Horario eliminado exitosamente");
      } else {
        alert("Error al eliminar horario");
      }
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Error al eliminar horario");
    }
  };

  if (loading) {
    return <div className="loading-spinner mx-auto"></div>;
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Horarios de Atención</h3>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Agregar Horario
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-4">Nuevo Horario</h4>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Día</label>
              <select
                value={formData.weekday}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weekday: parseInt(e.target.value),
                  })
                }
                className="form-input"
                required
              >
                {weekdays.map((day, index) => (
                  <option key={index} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Hora Inicio</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Hora Fin</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Duración (min)</label>
              <input
                type="number"
                value={formData.slot_duration_min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    slot_duration_min: parseInt(e.target.value),
                  })
                }
                className="form-input"
                min="15"
                max="60"
                step="15"
                required
              />
            </div>

            <div className="md:col-span-4 flex gap-2">
              <button type="submit" className="btn-primary">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {schedules.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No hay horarios configurados
        </p>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.schedule_id}
              className="flex justify-between items-center p-3 border rounded-lg"
            >
              <div>
                <span className="font-semibold">
                  {weekdays[schedule.weekday]}
                </span>
                <span className="text-gray-600 ml-4">
                  {schedule.start_time} - {schedule.end_time}
                </span>
                <span className="text-sm text-gray-500 ml-4">
                  (Duración: {schedule.slot_duration_min} min)
                </span>
              </div>
              <button
                onClick={() => handleDelete(schedule.schedule_id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
