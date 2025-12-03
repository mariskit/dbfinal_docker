"use client";

import { useState, useEffect } from "react";

interface Specialty {
  specialty_id: number;
  name: string;
  description: string | null;
}

export default function SpecialtiesManagement() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/specialties");
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data);
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/specialties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setFormData({ name: "", description: "" });
        fetchSpecialties();
        alert("Especialidad creada exitosamente");
      } else {
        const error = await response.json();
        alert(error.error || "Error al crear especialidad");
      }
    } catch (error) {
      console.error("Error creating specialty:", error);
      alert("Error al crear especialidad");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const response = await fetch(`/api/specialties/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        setFormData({ name: "", description: "" });
        fetchSpecialties();
        alert("Especialidad actualizada exitosamente");
      } else {
        const error = await response.json();
        alert(error.error || "Error al actualizar especialidad");
      }
    } catch (error) {
      console.error("Error updating specialty:", error);
      alert("Error al actualizar especialidad");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta especialidad?")) {
      return;
    }

    try {
      const response = await fetch(`/api/specialties/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchSpecialties();
        alert("Especialidad eliminada exitosamente");
      } else {
        alert("Error al eliminar especialidad");
      }
    } catch (error) {
      console.error("Error deleting specialty:", error);
      alert("Error al eliminar especialidad");
    }
  };

  const handleEdit = (specialty: Specialty) => {
    setEditingId(specialty.specialty_id);
    setFormData({
      name: specialty.name,
      description: specialty.description || "",
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", description: "" });
  };

  if (loading) {
    return <div className="loading-spinner mx-auto"></div>;
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Gestión de Especialidades</h3>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: "", description: "" });
          }}
          className="btn-primary"
        >
          Crear Especialidad
        </button>
      </div>

      {(showForm || editingId) && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-semibold mb-4">
            {editingId ? "Editar Especialidad" : "Crear Nueva Especialidad"}
          </h4>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingId ? "Actualizar" : "Crear"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {specialties.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  No hay especialidades registradas
                </td>
              </tr>
            ) : (
              specialties.map((specialty) => (
                <tr key={specialty.specialty_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {specialty.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {specialty.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(specialty)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(specialty.specialty_id)}
                      className="text-red-600 hover:text-red-800"
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

