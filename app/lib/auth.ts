import bcrypt from "bcryptjs";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Simulación de sesión (en producción usar NextAuth)
export interface SessionUser {
  id: number;
  email: string;
  role: string;
  name: string;
  patient_id?: number;
  doctor_id?: number;
}

export interface Session {
  user: SessionUser;
}

let currentSession: Session | null = null;

export function setSession(session: Session) {
  currentSession = session;
}

export function getSession(): Session | null {
  return currentSession;
}

export function clearSession() {
  currentSession = null;
}

// Función para verificar autenticación en API routes
export function requireAuth(request: Request): SessionUser {
  // En producción, verificarías el JWT token
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No autorizado");
  }

  // Simulación - en producción verificarías el token JWT
  const token = authHeader.slice(7);

  // Decodificar token (simulado)
  if (!token.startsWith("fake-jwt-token-")) {
    throw new Error("Token inválido");
  }

  const userId = parseInt(token.replace("fake-jwt-token-", ""));

  // Usuario simulado
  return {
    id: userId,
    email: "user@example.com",
    role: "patient",
    name: "Usuario Ejemplo",
  };
}
