"use client";

import { useState, useEffect } from "react";

interface Specialty {
  specialty_id: number;
  name: string;
  description: string | null;
}

interface DoctorSpecialtiesManagerProps {
  doctorId: number;
  onUpdate?: () => void;
}

export default function DoctorSpecialtiesManager({
  doctorId,
  onUpdate,
}: DoctorSpecialtiesManagerProps) {
  const [allSpecialties, setAllSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, [doctorId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Obtener todas las especialidades disponibles
      const allResponse = await fetch("/api/specialties");
      const allData = await allResponse.json();
      setAllSpecialties(allData);

      // Obtener especialidades del doctor
      const doctorResponse = await fetch(
        `/api/doctors/${doctorId}/specialties`
      );
      if (doctorResponse.ok) {
        const doctorData = await doctorResponse.json();
        setSelectedSpecialties(doctorData.map((s: Specialty) => s.specialty_id));
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSpecialty = (specialtyId: number) => {
    setSelectedSpecialties((prev) => {
      if (prev.includes(specialtyId)) {
        return prev.filter((id) => id !== specialtyId);
      } else {
        return [...prev, specialtyId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(`/api/doctors/${doctorId}/specialties`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty_ids: selectedSpecialties }),
      });

      if (response.ok) {
        setMessage("Especialidades actualizadas exitosamente");
        setTimeout(() => setMessage(""), 3000);
        if (onUpdate) onUpdate();
      } else {
        const error = await response.json();
        setMessage(error.error || "Error al actualizar especialidades");
      }
    } catch (error) {
      console.error("Error saving specialties:", error);
      setMessage("Error al guardar especialidades");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando especialidades...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Mis Especialidades
      </h3>
      {message && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            message.includes("éxito")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
        {allSpecialties.length === 0 ? (
          <p className="text-gray-500">No hay especialidades disponibles</p>
        ) : (
          allSpecialties.map((specialty) => (
            <label
              key={specialty.specialty_id}
              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedSpecialties.includes(specialty.specialty_id)}
                onChange={() => handleToggleSpecialty(specialty.specialty_id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {specialty.name}
                </span>
                {specialty.description && (
                  <p className="text-xs text-gray-500">
                    {specialty.description}
                  </p>
                )}
              </div>
            </label>
          ))
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full"
      >
        {saving ? "Guardando..." : "Guardar Especialidades"}
      </button>
    </div>
  );
}

