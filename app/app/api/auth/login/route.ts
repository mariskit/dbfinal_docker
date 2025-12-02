import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const connection = await getConnection();
  
  try {
    const { email, password } = await request.json();
    
    console.log("🔵 [LOGIN API] Intento de login para:", email);

    // Validaciones básicas
    if (!email || !password) {
      connection.release();
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario con TODOS los datos necesarios
    const [users] = await connection.execute(
      `SELECT 
        u.user_id, u.username, u.email, u.password_hash, u.role, u.created_at,
        p.patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
        p.phone as patient_phone, p.birthdate,
        d.doctor_id, d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        d.doc_license, d.phone as doctor_phone, d.bio
       FROM Users u
       LEFT JOIN Patients p ON u.user_id = p.user_id
       LEFT JOIN Doctors d ON u.user_id = d.user_id
       WHERE u.email = ?`,
      [email]
    );

    const userArray = users as any[];

    if (userArray.length === 0) {
      connection.release();
      console.log("🔴 [LOGIN API] Usuario no encontrado:", email);
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const user = userArray[0];
    console.log("🔵 [LOGIN API] Usuario encontrado, verificando contraseña...");

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      connection.release();
      console.log("🔴 [LOGIN API] Contraseña inválida para:", email);
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Preparar respuesta del usuario con todos los datos
    const userResponse = {
      id: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      name: user.patient_first_name || user.doctor_first_name || user.username,
      patient_id: user.patient_id || null,
      doctor_id: user.doctor_id || null,
      created_at: user.created_at,
    };

    // Generar token simple (en producción usar JWT)
    const token = `clinic-token-${user.user_id}-${Date.now()}`;

    console.log("🟢 [LOGIN API] Login exitoso para:", email);
    connection.release();

    return NextResponse.json({
      message: "Login exitoso",
      token,
      user: userResponse,
    });
  } catch (error: any) {
    connection.release();
    console.error("🔴 [LOGIN API] Error en login:", error);
    return NextResponse.json(
      { 
        error: error.message || "Error interno del servidor",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
