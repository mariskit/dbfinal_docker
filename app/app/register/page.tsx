"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthContext } from "@/hooks/AuthProvider";
import { isValidEmail, isValidPhone } from "@/lib/utils";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    first_name: "",
    last_name: "",
    phone: "",
    birthdate: "",
    doc_license: "",
    bio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const { register } = useAuthContext();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = "El nombre es requerido";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "El apellido es requerido";
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = "Teléfono inválido";
    }

    if (formData.role === "doctor" && !formData.doc_license.trim()) {
      newErrors.doc_license = "La licencia médica es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🔵 [DEBUG] handleSubmit iniciado");
    console.log("🔵 [DEBUG] formData recibido:", formData);

    setSubmitError("");
    setSuccessMessage("");

    if (!validateForm()) {
      console.warn("🟡 [DEBUG] Validación falló, deteniendo submit");
      return;
    }

    setLoading(true);
    console.log("🔵 [DEBUG] Validación OK → Preparando payload...");

    try {
      // Preparar datos para el registro
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        userData: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone || null,
          birthdate: formData.birthdate || null,
          doc_license: formData.doc_license || null,
          bio: formData.bio || null,
          address: null,
        },
      };

      console.log("🔵 [DEBUG] Payload listo para enviar:", userData);

      console.log("🔵 [DEBUG] Llamando a register()...");
      const result = await register(userData);
      console.log("🟢 [DEBUG] Respuesta de register():", result);

      if (result.success) {
        console.log("🟢 [DEBUG] Registro exitoso");

        setSuccessMessage("¡Registro exitoso! Redirigiendo al login...");

        setTimeout(() => {
          console.log("🔵 [DEBUG] Redirigiendo a /login...");
          router.push(
            "/login?message=Registro exitoso. Ahora puedes iniciar sesión."
          );
        }, 2000);
      } else {
        console.error(
          "🔴 [DEBUG] Error devuelto por register():",
          result.error
        );
        setSubmitError(result.error || "Error al registrar usuario");
      }
    } catch (error: any) {
      console.error("🔴 [DEBUG] Excepción en handleSubmit:", error);
      setSubmitError(error.message || "Error de conexión");
    } finally {
      console.log("🔵 [DEBUG] handleSubmit finalizado");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            O{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              iniciar sesión en una cuenta existente
            </Link>
          </p>
        </div>

        {/* Mensajes */}
        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {submitError}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <strong>Éxito:</strong> {successMessage}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="form-label">
                Nombre de Usuario *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`form-input ${
                  errors.username ? "border-red-500" : ""
                }`}
                placeholder="juan.perez"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`form-input ${errors.email ? "border-red-500" : ""}`}
                placeholder="juan@ejemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="first_name" className="form-label">
                Nombre *
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                className={`form-input ${
                  errors.first_name ? "border-red-500" : ""
                }`}
                placeholder="Juan"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            {/* Apellido */}
            <div>
              <label htmlFor="last_name" className="form-label">
                Apellido *
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                className={`form-input ${
                  errors.last_name ? "border-red-500" : ""
                }`}
                placeholder="Pérez"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="form-label">
                Contraseña *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`form-input ${
                  errors.password ? "border-red-500" : ""
                }`}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Contraseña *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`form-input ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Rol */}
            <div>
              <label htmlFor="role" className="form-label">
                Tipo de Cuenta *
              </label>
              <select
                id="role"
                name="role"
                required
                className="form-input"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="patient">Paciente</option>
                <option value="doctor">Médico</option>
              </select>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="form-label">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`form-input ${errors.phone ? "border-red-500" : ""}`}
                placeholder="+34 123 456 789"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Para Pacientes: Fecha de Nacimiento */}
            {formData.role === "patient" && (
              <div>
                <label htmlFor="birthdate" className="form-label">
                  Fecha de Nacimiento
                </label>
                <input
                  id="birthdate"
                  name="birthdate"
                  type="date"
                  className="form-input"
                  value={formData.birthdate}
                  onChange={(e) =>
                    setFormData({ ...formData, birthdate: e.target.value })
                  }
                />
              </div>
            )}

            {/* Para Médicos: Licencia Médica */}
            {formData.role === "doctor" && (
              <>
                <div>
                  <label htmlFor="doc_license" className="form-label">
                    Licencia Médica *
                  </label>
                  <input
                    id="doc_license"
                    name="doc_license"
                    type="text"
                    required={formData.role === "doctor"}
                    className={`form-input ${
                      errors.doc_license ? "border-red-500" : ""
                    }`}
                    placeholder="MED-12345"
                    value={formData.doc_license}
                    onChange={(e) =>
                      setFormData({ ...formData, doc_license: e.target.value })
                    }
                  />
                  {errors.doc_license && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.doc_license}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="bio" className="form-label">
                    Biografía (opcional)
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    className="form-input"
                    placeholder="Breve descripción de su experiencia y especialidades..."
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registrando...
                </>
              ) : (
                "Registrarse"
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Al registrarte, aceptas nuestros{" "}
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Términos de Servicio
              </a>{" "}
              y{" "}
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Política de Privacidad
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
