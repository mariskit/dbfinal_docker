"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/AuthProvider";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuthContext();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        name: user.name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    // Simular guardado
    setTimeout(() => {
      setSaving(false);
      setMessage("Perfil actualizado exitosamente");
      setTimeout(() => setMessage(""), 3000);
    }, 1000);
  };

  if (authLoading) {
    return <LoadingSpinner message="Cargando perfil..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Información del usuario */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-blue-600">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.name}
                </h2>
                <p className="text-gray-600 mt-1">{user?.email}</p>
                <div
                  className={`mt-3 px-3 py-1 rounded-full text-sm font-medium ${
                    user?.role === "admin"
                      ? "bg-purple-100 text-purple-800"
                      : user?.role === "doctor"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user?.role === "admin"
                    ? "Administrador"
                    : user?.role === "doctor"
                    ? "Médico"
                    : "Paciente"}
                </div>
                <div className="mt-6 text-sm text-gray-500">
                  Miembro desde: {new Date().toLocaleDateString("es-ES")}
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de edición */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {message && (
                <div
                  className={`p-4 rounded-lg ${
                    message.includes("éxito")
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Información Personal
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Nombre completo</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="form-input"
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      El email no se puede cambiar
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="form-input"
                      placeholder="+34 123 456 789"
                    />
                  </div>

                  <div>
                    <label className="form-label">Rol</label>
                    <input
                      type="text"
                      value={
                        user?.role === "admin"
                          ? "Administrador"
                          : user?.role === "doctor"
                          ? "Médico"
                          : "Paciente"
                      }
                      className="form-input bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Cambiar Contraseña
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="form-label">Contraseña actual</label>
                    <input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="form-input"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="form-label">Nueva contraseña</label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      className="form-input"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="form-input"
                      placeholder="••••••••"
                    />
                  </div>

                  <p className="text-sm text-gray-500">
                    La contraseña debe tener al menos 8 caracteres, incluir
                    mayúsculas, minúsculas, números y caracteres especiales.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
