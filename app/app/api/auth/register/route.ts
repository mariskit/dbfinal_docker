import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const connection = await getConnection();
  
  try {
    const { username, email, password, role, userData } = await request.json();
    
    console.log("🔵 [REGISTER API] Datos recibidos:", {
      username,
      email,
      role,
      userData: userData ? { ...userData, password: "***" } : null,
    });

    // Validaciones básicas
    if (!username || !email || !password || !role) {
      connection.release();
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validar userData
    if (!userData || !userData.first_name || !userData.last_name) {
      connection.release();
      return NextResponse.json(
        { error: "Los datos del usuario (nombre y apellido) son requeridos" },
        { status: 400 }
      );
    }

    // Validar doc_license para doctores
    if (role === "doctor" && !userData.doc_license) {
      connection.release();
      return NextResponse.json(
        { error: "La licencia médica es requerida para doctores" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.execute(
      "SELECT user_id FROM Users WHERE email = ? OR username = ?",
      [email, username]
    );

    if ((existingUsers as any[]).length > 0) {
      connection.release();
      return NextResponse.json(
        { error: "El usuario o email ya está registrado" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    console.log("🔵 [REGISTER API] Password hasheado, iniciando transacción...");

    await connection.beginTransaction();

    try {
      // Insertar usuario
      const [userResult] = await connection.execute(
        `INSERT INTO Users (username, email, password_hash, role) 
         VALUES (?, ?, ?, ?)`,
        [username, email, passwordHash, role]
      );

      const userId = (userResult as any).insertId;
      console.log("🟢 [REGISTER API] Usuario insertado con ID:", userId);

      // Insertar datos específicos según el rol
      if (role === "patient") {
        console.log("🔵 [REGISTER API] Insertando datos de paciente...");
        await connection.execute(
          `INSERT INTO Patients 
           (user_id, first_name, last_name, birthdate, phone, address) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            userData.first_name,
            userData.last_name,
            userData.birthdate || null,
            userData.phone || null,
            userData.address || null,
          ]
        );
        console.log("🟢 [REGISTER API] Paciente insertado exitosamente");
      } else if (role === "doctor") {
        console.log("🔵 [REGISTER API] Insertando datos de doctor...");
        await connection.execute(
          `INSERT INTO Doctors 
           (user_id, first_name, last_name, doc_license, phone, bio) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            userId,
            userData.first_name,
            userData.last_name,
            userData.doc_license || null,
            userData.phone || null,
            userData.bio || null,
          ]
        );
        console.log("🟢 [REGISTER API] Doctor insertado exitosamente");
      }

      await connection.commit();
      console.log("🟢 [REGISTER API] Transacción completada exitosamente");
      connection.release();

      return NextResponse.json({
        success: true,
        message: "Usuario registrado exitosamente",
        user_id: userId,
      });
    } catch (error: any) {
      await connection.rollback();
      connection.release();
      console.error("Error en transacción:", error);

      // Detectar errores específicos de MySQL
      if (error.code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          { error: "El usuario o email ya existe" },
          { status: 400 }
        );
      }

      throw error;
    }
  } catch (error: any) {
    connection.release();
    console.error("Error en registro:", error);

    return NextResponse.json(
      {
        error: error.message || "Error interno del servidor",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
