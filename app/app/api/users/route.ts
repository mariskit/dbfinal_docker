import { NextResponse } from "next/server";
import { getConnection } from "@/lib/database";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const connection = await getConnection();

    const [users] = await connection.execute(`
      SELECT u.user_id, u.username, u.email, u.role, u.created_at,
             p.first_name, p.last_name, p.birthdate, p.phone, p.address,
             d.first_name as doc_first_name, d.last_name as doc_last_name,
             d.doc_license, d.phone as doc_phone, d.bio
      FROM Users u
      LEFT JOIN Patients p ON u.user_id = p.user_id
      LEFT JOIN Doctors d ON u.user_id = d.user_id
      ORDER BY u.role, u.created_at DESC
    `);

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      username,
      email,
      password,
      role,
      first_name,
      last_name,
      birthdate,
      phone,
      address,
      doc_license,
      bio,
    } = await request.json();

    if (!username || !email || !password || !role || !first_name || !last_name) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes" },
        { status: 400 }
      );
    }

    const connection = await getConnection();
    await connection.beginTransaction();

    try {
      // Verificar si el usuario o email ya existen
      const [existingUsers] = await connection.execute(
        "SELECT user_id FROM Users WHERE username = ? OR email = ?",
        [username, email]
      );

      if ((existingUsers as any[]).length > 0) {
        throw new Error("El username o email ya existe");
      }

      // Crear hash de contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Crear usuario
      const [result] = await connection.execute(
        "INSERT INTO Users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
        [username, email, hashedPassword, role]
      );

      const userId = (result as any).insertId;

      // Crear perfil según el rol
      if (role === "patient") {
        await connection.execute(
          `INSERT INTO Patients (user_id, first_name, last_name, birthdate, phone, address)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, first_name, last_name, birthdate || null, phone || null, address || null]
        );
      } else if (role === "doctor") {
        await connection.execute(
          `INSERT INTO Doctors (user_id, first_name, last_name, doc_license, phone, bio)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, first_name, last_name, doc_license || null, phone || null, bio || null]
        );
      }

      await connection.commit();
      return NextResponse.json({
        message: "Usuario creado exitosamente",
        user_id: userId,
      });
    } catch (error: any) {
      await connection.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { user_id, role } = await request.json();
    const connection = await getConnection();

    await connection.execute(
      "UPDATE Users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
      [role, user_id]
    );

    return NextResponse.json({
      message: "Rol actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
