"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import { api } from "@/lib/api";
import type { DoctorSchedule } from "@/lib/types";

const weekdays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export default function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weekday: 1,
    start_time: "08:00",
    end_time: "17:00",
    slot_duration_min: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, loading: authLoading, isDoctor } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || !isDoctor)) {
      router.push("/dashboard");
    }
  }, [authLoading, user, isDoctor, router]);

  useEffect(() => {
    if (user?.doctor_id) {
      fetchSchedules();
    }
  }, [user]);

  const fetchSchedules = async () => {
    try {
      if (user?.doctor_id) {
        const data = await api.getDoctorSchedules(user.doctor_id);
        setSchedules(data);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.getDoctorSchedule(
        user?.doctor_id || 0,
        new Date().toISOString().split("T")[0]
      ); // Usando función existente
      // En una implementación real, crearías un endpoint POST específico para schedules

      alert("Funcionalidad de agregar horario en desarrollo");
      setShowForm(false);
    } catch (error) {
      console.error("Error creating schedule:", error);
      alert("Error al agregar horario");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (!confirm("¿Está seguro de eliminar este horario?")) {
      return;
    }

    try {
      // En una implementación real, usarías api.deleteDoctorSchedule(scheduleId)
      alert("Funcionalidad de eliminar horario en desarrollo");
      fetchSchedules();
    } catch (error) {
      console.error("Error deleting schedule:", error);
      alert("Error al eliminar horario");
    }
  };

  if (authLoading || loading) {
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
              <button
                onClick={() => router.push("/dashboard/doctor")}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-semibold">
                Mis Horarios de Atención
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Horarios Configurados</h2>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                + Agregar Horario
              </button>
            </div>

            {showForm && (
              <div className="mb-8 p-6 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Nuevo Horario</h3>
                <form
                  onSubmit={handleSubmit}
                  className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <div>
                    <label className="form-label">Día de la Semana</label>
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
                    <label className="form-label">Hora de Inicio</label>
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
                    <label className="form-label">Hora de Fin</label>
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
                    <label className="form-label">
                      Duración por Cita (min)
                    </label>
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

                  <div className="md:col-span-4 flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                    >
                      {saving ? "Guardando..." : "Guardar Horario"}
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
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">
                  No hay horarios configurados
                </p>
                <p className="text-gray-600 text-sm mb-6">
                  Configure sus horarios de atención para que los pacientes
                  puedan agendar citas.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  Configurar Mi Primer Horario
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.schedule_id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-4">
                          <span className="font-semibold text-lg">
                            {weekdays[schedule.weekday]}
                          </span>
                          <span className="text-gray-600">
                            {schedule.start_time} - {schedule.end_time}
                          </span>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {schedule.slot_duration_min} min por cita
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Total de horas disponibles:{" "}
                          {parseInt(schedule.end_time.split(":")[0]) -
                            parseInt(schedule.start_time.split(":")[0])}{" "}
                          horas
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(schedule.schedule_id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t">
              <h4 className="font-semibold mb-3">Recomendaciones</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Configure horarios realistas según su disponibilidad</li>
                <li>• Considere tiempos de descanso entre citas</li>
                <li>
                  • Actualice sus horarios con anticipación si hay cambios
                </li>
                <li>
                  • Los pacientes podrán ver sus horarios disponibles al agendar
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
