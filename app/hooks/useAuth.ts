import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  email: string;
  role: string;
  name: string;
  patient_id?: number;
  doctor_id?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    initialized: false,
  });
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay sesión guardada
    const token = getCookie("auth-token");
    const userData = getCookie("user-data");

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({
          user,
          token,
          loading: false,
          initialized: true,
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
        logout();
      }
    } else {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        initialized: true,
      }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      console.log("🔵 [LOGIN HOOK] Iniciando login para:", email);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("🔴 [LOGIN HOOK] Error al parsear respuesta JSON:", jsonError);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (response.ok) {
        console.log("🟢 [LOGIN HOOK] Login exitoso, guardando datos...");
        
        // Guardar en cookies
        setCookie("auth-token", data.token, 7);
        setCookie("user-data", JSON.stringify(data.user), 7);
        setCookie("user-role", data.user.role, 7);

        // Actualizar estado
        setAuthState({
          user: data.user,
          token: data.token,
          loading: false,
          initialized: true,
        });

        return { success: true, user: data.user };
      } else {
        const errorMessage = data?.error || `Error ${response.status}: ${response.statusText}`;
        console.error("🔴 [LOGIN HOOK] Error en respuesta:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("🔴 [LOGIN HOOK] Error en login:", error);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return {
        success: false,
        error: error.message || "Error de conexión",
      };
    }
  }, []);

  const logout = useCallback(() => {
    // Limpiar cookies
    deleteCookie("auth-token");
    deleteCookie("user-data");
    deleteCookie("user-role");

    // Limpiar estado
    setAuthState({
      user: null,
      token: null,
      loading: false,
      initialized: true,
    });

    // Redirigir a login
    router.push("/login");
  }, [router]);

  const register = useCallback(async (userData: any) => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data,
          message: "Usuario registrado exitosamente",
        };
      } else {
        throw new Error(data.error || "Error al registrar usuario");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.message || "Error de conexión",
      };
    } finally {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const isAuthenticated = !!authState.user && !!authState.token;
  const isAdmin = authState.user?.role === "admin";
  const isDoctor = authState.user?.role === "doctor";
  const isPatient = authState.user?.role === "patient";

  return {
    ...authState,
    login,
    logout,
    register,
    isAuthenticated,
    isAdmin,
    isDoctor,
    isPatient,
  };
}

// Helper functions para cookies
function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = `${name}=`;
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}
